import hashlib
import json
import logging
from typing import Dict, Any, Tuple, Optional
from app.core.config import settings
from blockfrost import BlockFrostApi, ApiError

# PyCardano imports
from pycardano import (
    BlockFrostChainContext,
    PaymentSigningKey,
    PaymentVerificationKey,
    Address,
    TransactionBuilder,
    TransactionOutput,
    MultiAsset,
    Asset,
    AssetName,
    ScriptPubkey,
    ScriptAll,
    Metadata,
    AuxiliaryData,
    Network,
    TransactionBody,
    TransactionWitnessSet,
    ScriptHash,
    Value
)

logger = logging.getLogger(__name__)

class BlockchainService:
    def __init__(self):
        self.project_id = settings.blockfrost_project_id
        self.network_name = settings.cardano_network.lower() if settings.cardano_network else "preprod"
        self.api = None
        self.context = None
        self.network = Network.TESTNET
        
        if not self.project_id:
            logger.warning("Blockfrost Project ID not set. Blockchain features will be disabled.")
            return

        # Initialize Blockfrost API
        base_url = None
        if self.network_name == "mainnet":
            base_url = "https://cardano-mainnet.blockfrost.io/api"
            self.network = Network.MAINNET
        elif self.network_name == "preprod":
            base_url = "https://cardano-preprod.blockfrost.io/api"
            self.network = Network.TESTNET
        elif self.network_name == "preview":
            base_url = "https://cardano-preview.blockfrost.io/api"
            self.network = Network.TESTNET
        else:
            logger.error(f"Invalid Cardano network: {self.network_name}")
            return

        try:
            self.api = BlockFrostApi(project_id=self.project_id, base_url=base_url)
            self.context = BlockFrostChainContext(self.project_id, base_url=base_url)
        except Exception as e:
            logger.warning(f"Failed to initialize Blockfrost: {e}. Blockchain features will be disabled.")

    def _get_signing_key(self, signing_key_hex: str) -> PaymentSigningKey:
        if not signing_key_hex:
            raise ValueError("School wallet signing key not provided.")
        try:
            # Try loading from CBOR hex first (common format)
            return PaymentSigningKey.from_cbor(signing_key_hex)
        except Exception:
            try:
                # Try loading from raw hex
                return PaymentSigningKey.from_primitive(bytes.fromhex(signing_key_hex))
            except Exception as e:
                logger.error(f"Failed to load signing key: {e}")
                raise ValueError("Invalid signing key format.")

    def _get_payment_address(self, payment_vkey: PaymentVerificationKey) -> Address:
        return Address(payment_vkey.hash(), network=self.network)

    def get_policy_id(self, signing_key_hex: str) -> Tuple[ScriptHash, ScriptPubkey, PaymentVerificationKey]:
        """
        Generates the Policy ID for the school using their specific key.
        """
        signing_key = self._get_signing_key(signing_key_hex)
        payment_vkey = PaymentVerificationKey.from_signing_key(signing_key)
        
        # Create a simple script: "Require signature from this key"
        policy_script = ScriptPubkey(payment_vkey.hash())
        policy_id = policy_script.hash()  # ScriptHash (used as PolicyId)
        
        return policy_id, policy_script, payment_vkey

    def hash_student_record(self, record_data: str) -> str:
        """Creates a SHA-256 hash of the student record string."""
        return hashlib.sha256(record_data.encode('utf-8')).hexdigest()

    def get_balance(self, address: str) -> float:
        """Gets the ADA balance of an address."""
        if not self.api:
            return 0.0
        try:
            addr = self.api.address(address)
            # Find the 'lovelace' amount
            for amount in addr.amount:
                if amount.unit == 'lovelace':
                    return int(amount.quantity) / 1_000_000 # Convert to ADA
            return 0.0
        except ApiError as e:
            # 404 means the address exists but has never received funds - this is normal
            if hasattr(e, 'status_code') and e.status_code == 404:
                logger.info(f"Address {address[:20]}... has no transaction history yet (0 ADA)")
                return 0.0
            logger.error(f"Failed to fetch balance: {e}")
            return 0.0
        except Exception as e:
            logger.error(f"Failed to fetch balance: {e}")
            return 0.0

    def issue_credential(self, 
                         signing_key_hex: str,
                         student_admission_number: str, 
                         credential_metadata: Dict[str, Any],
                         student_address: Optional[str] = None) -> Dict[str, str]:
        """
        Issues a Verifiable Credential (VC) as a Native Asset on Cardano.
        
        Args:
            signing_key_hex: The School's private key (Issuer).
            student_admission_number: Used to generate a unique Asset Name.
            credential_metadata: The W3C-compatible JSON payload.
            student_address: (Optional) The Student's wallet address.
        """
        if not self.context:
            raise RuntimeError("Blockchain service not initialized properly.")

        signing_key = self._get_signing_key(signing_key_hex)
        policy_id, policy_script, payment_vkey = self.get_policy_id(signing_key_hex)
        school_address = self._get_payment_address(payment_vkey)

        # Asset Name: "VC" + Admission Number (Hex encoded)
        # We use a prefix "VC" to distinguish from other assets
        asset_name_str = f"VC{student_admission_number}"
        try:
            asset_name = AssetName(asset_name_str.encode('utf-8'))
        except Exception:
            # Fallback if name is too long (max 32 bytes)
            # Use hash of the string
            hashed_name = hashlib.sha256(asset_name_str.encode('utf-8')).hexdigest()[:32]
            asset_name = AssetName(hashed_name.encode('utf-8'))
            asset_name_str = hashed_name

        # Define the asset to mint (Amount: 1)
        my_asset = Asset()
        my_asset[asset_name] = 1
        
        multi_asset = MultiAsset()
        multi_asset[policy_id] = my_asset

        # Native Assets Metadata (CIP-25)
        # We wrap the VC payload in the standard 721 label
        native_assets = {
            policy_id.to_primitive().hex(): {
                asset_name_str: credential_metadata
            }
        }
        
        metadata = Metadata()
        metadata[721] = native_assets
        auxiliary_data = AuxiliaryData(data=metadata)

        # Build Transaction
        tx_builder = TransactionBuilder(self.context)
        tx_builder.add_input_address(school_address)
        
        # Output: Send 1 Token + Min ADA to destination
        destination_address = Address.from_primitive(student_address) if student_address else school_address
        
        # Create Value with 2 ADA (2,000,000 lovelace) min-ada placeholder and the asset
        # The builder will ensure min-ada is met if we use a sufficient amount, 
        # but explicit Value is required for multi-asset outputs.
        output_value = Value(2000000, multi_asset)
        
        tx_builder.add_output(
            TransactionOutput(destination_address, amount=output_value)
        )
        
        # Set Minting field
        tx_builder.mint = multi_asset
        tx_builder.native_scripts = [policy_script]
        tx_builder.auxiliary_data = auxiliary_data

        # Calculate fee and build
        signed_tx = tx_builder.build_and_sign([signing_key], change_address=school_address)

        # Submit Transaction
        try:
            logger.info(f"Submitting VC issuance for student {student_admission_number}...")
            self.context.submit_tx(signed_tx)
            tx_hash = str(signed_tx.id)
            logger.info(f"VC Issued! Hash: {tx_hash}")
            
            return {
                "tx_hash": tx_hash,
                "asset_id": f"{policy_id.to_primitive().hex()}{asset_name.payload.hex()}",
                "policy_id": policy_id.to_primitive().hex(),
                "asset_name": asset_name_str
            }
        except Exception as e:
            logger.error(f"VC issuance failed: {e}")
            raise e

    def verify_transaction(self, tx_hash: str) -> bool:
        """Checks if a transaction is confirmed on-chain."""
        if not self.api:
            return False
        try:
            tx = self.api.transaction(tx_hash)
            return True if tx else False
        except ApiError:
            return False
