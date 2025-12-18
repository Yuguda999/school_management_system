from pycardano import PaymentSigningKey, PaymentVerificationKey, Address, Network

def generate_school_wallet():
    """
    Generates a new Cardano wallet (Signing Key and Address) for the school.
    Prints the values to the console for easy setup.
    """
    # Generate a new key pair
    signing_key = PaymentSigningKey.generate()
    verification_key = PaymentVerificationKey.from_signing_key(signing_key)
    
    # Derive address (Testnet/Preprod)
    # Note: Change network=Network.MAINNET for production
    address = Address(verification_key.hash(), network=Network.TESTNET)
    
    print("\n" + "="*50)
    print("🎓  NEW SCHOOL WALLET GENERATED  🎓")
    print("="*50)
    print(f"\n1. Public Address (Share this to receive funds):")
    print(f"   {address}")
    
    print(f"\n2. Signing Key (SECRET - Add this to your .env file):")
    print(f"   {signing_key.to_cbor().hex()}")
    
    print("\n" + "="*50)
    print("NEXT STEPS:")
    print("1. Copy the 'Signing Key' value above.")
    print("2. Paste it into your backend/.env file as:")
    print("   SCHOOL_WALLET_SIGNING_KEY=<paste_key_here>")
    print("3. Go to the Cardano Faucet to get free Testnet ADA:")
    print("   https://docs.cardano.org/cardano-testnet/tools/faucet")
    print("   (Enter the Public Address generated above)")
    print("="*50 + "\n")

if __name__ == "__main__":
    generate_school_wallet()
