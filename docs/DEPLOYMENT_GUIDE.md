# 🚀 Deployment Guide

This guide covers different deployment strategies for the School Management System, from simple single-server deployments to scalable cloud architectures.

## 📋 Pre-deployment Checklist

Before deploying to production, ensure you have:

- [ ] Configured all environment variables
- [ ] Set up SSL certificates
- [ ] Configured database backups
- [ ] Set up monitoring and logging
- [ ] Tested the application thoroughly
- [ ] Prepared rollback strategy
- [ ] Configured firewall and security settings

## 🐳 Docker Deployment (Recommended)

### Single Server Deployment

#### 1. Prepare the Server

**System Requirements:**
- Ubuntu 20.04+ or CentOS 8+
- 4GB RAM minimum (8GB recommended)
- 50GB storage minimum
- Docker and Docker Compose installed

**Install Docker:**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.12.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login to apply group changes
```

#### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-username/school-management-system.git
cd school-management-system

# Create production environment files
cp backend/.env.example backend/.env.prod
cp frontend/.env.example frontend/.env.prod

# Edit environment files
nano backend/.env.prod
nano frontend/.env.prod
```

**Production Environment Variables:**

**Backend (.env.prod):**
```env
# Environment
ENVIRONMENT=production
DEBUG=false

# Database
DATABASE_URL=postgresql://school_user:secure_password@db:5432/school_management

# Security
SECRET_KEY=your-super-secure-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
BACKEND_CORS_ORIGINS=["https://yourdomain.com"]

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Redis
REDIS_URL=redis://redis:6379/0

# File Storage
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
```

**Frontend (.env.prod):**
```env
VITE_API_URL=https://yourdomain.com
VITE_APP_NAME=School Management System
VITE_NODE_ENV=production
```

#### 3. Create Production Docker Compose

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: school_management
      POSTGRES_USER: school_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    networks:
      - school_network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - school_network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    env_file:
      - ./backend/.env.prod
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - school_network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    env_file:
      - ./frontend/.env.prod
    restart: unless-stopped
    networks:
      - school_network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./uploads:/var/www/uploads
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - school_network

volumes:
  postgres_data:

networks:
  school_network:
    driver: bridge
```

#### 4. Configure Nginx

Create `nginx/nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;

        # Security Headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # API Routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # File Uploads
        location /uploads/ {
            alias /var/www/uploads/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

#### 5. Set Up SSL Certificate

**Using Let's Encrypt:**
```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to nginx directory
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
sudo chown -R $USER:$USER nginx/ssl/
```

#### 6. Deploy

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Create superuser (optional)
docker-compose -f docker-compose.prod.yml exec backend python scripts/create_superuser.py

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## ☁️ Cloud Deployment

### AWS Deployment

#### Using AWS ECS with Fargate

1. **Create ECR Repositories:**
```bash
# Create repositories for backend and frontend
aws ecr create-repository --repository-name school-management-backend
aws ecr create-repository --repository-name school-management-frontend
```

2. **Build and Push Images:**
```bash
# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -t school-management-backend ./backend
docker tag school-management-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/school-management-backend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/school-management-backend:latest

# Build and push frontend
docker build -t school-management-frontend ./frontend
docker tag school-management-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/school-management-frontend:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/school-management-frontend:latest
```

3. **Create ECS Task Definition:**
```json
{
  "family": "school-management",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/school-management-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:pass@rds-endpoint:5432/school_management"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/school-management",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Google Cloud Platform (GCP)

#### Using Google Cloud Run

1. **Build and Deploy Backend:**
```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/school-management-backend ./backend

# Deploy to Cloud Run
gcloud run deploy school-management-backend \
  --image gcr.io/PROJECT_ID/school-management-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

2. **Set Environment Variables:**
```bash
gcloud run services update school-management-backend \
  --set-env-vars DATABASE_URL="postgresql://..." \
  --set-env-vars SECRET_KEY="..." \
  --region us-central1
```

### Azure Deployment

#### Using Azure Container Instances

```bash
# Create resource group
az group create --name school-management --location eastus

# Create container group
az container create \
  --resource-group school-management \
  --name school-management-app \
  --image your-registry/school-management:latest \
  --dns-name-label school-management \
  --ports 80 443 \
  --environment-variables DATABASE_URL="..." SECRET_KEY="..."
```

## 🔧 Production Optimizations

### Database Optimization

1. **Connection Pooling:**
```python
# In backend/app/database.py
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=30,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

2. **Database Indexes:**
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_students_admission_number ON students(admission_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_fee_payments_student_id ON fee_payments(student_id);
```

### Caching Strategy

1. **Redis Configuration:**
```python
# In backend/app/core/cache.py
import redis
from functools import wraps

redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

def cache_result(expiration=300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{hash(str(args) + str(kwargs))}"
            cached_result = redis_client.get(cache_key)
            
            if cached_result:
                return json.loads(cached_result)
            
            result = await func(*args, **kwargs)
            redis_client.setex(cache_key, expiration, json.dumps(result))
            return result
        return wrapper
    return decorator
```

### CDN Configuration

1. **AWS CloudFront:**
```yaml
# cloudformation template
Resources:
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt LoadBalancer.DNSName
            Id: school-management-origin
            CustomOriginConfig:
              HTTPPort: 80
              HTTPSPort: 443
              OriginProtocolPolicy: https-only
        DefaultCacheBehavior:
          TargetOriginId: school-management-origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad
```

## 📊 Monitoring and Logging

### Application Monitoring

1. **Prometheus + Grafana:**
```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```

2. **Health Checks:**
```python
# In backend/app/api/v1/health.py
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0",
        "database": await check_database_health(),
        "redis": await check_redis_health()
    }
```

### Log Management

1. **Structured Logging:**
```python
# In backend/app/core/logging.py
import structlog

logger = structlog.get_logger()

# Usage
logger.info("User login", user_id=user.id, ip_address=request.client.host)
```

2. **Log Aggregation with ELK Stack:**
```yaml
# docker-compose.logging.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:7.15.0
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline

  kibana:
    image: docker.elastic.co/kibana/kibana:7.15.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

## 🔒 Security Hardening

### Server Security

1. **Firewall Configuration:**
```bash
# UFW configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

2. **Fail2Ban:**
```bash
# Install and configure Fail2Ban
sudo apt install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Configure for nginx
sudo nano /etc/fail2ban/jail.local
# Add nginx-http-auth and nginx-limit-req jails
```

### Application Security

1. **Security Headers:**
```python
# In backend/app/middleware/security.py
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
)
```

2. **Rate Limiting:**
```python
# In backend/app/middleware/rate_limit.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/api/v1/auth/login")
@limiter.limit("5/minute")
async def login(request: Request):
    # Login logic
    pass
```

## 🔄 Backup and Recovery

### Database Backups

1. **Automated Backups:**
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="school_management"

# Create backup
docker-compose exec -T db pg_dump -U school_user $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/
```

2. **Cron Job:**
```bash
# Add to crontab
0 2 * * * /path/to/backup.sh
```

### Disaster Recovery

1. **Recovery Script:**
```bash
#!/bin/bash
# restore.sh
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Stop application
docker-compose down

# Restore database
gunzip -c $BACKUP_FILE | docker-compose exec -T db psql -U school_user school_management

# Start application
docker-compose up -d
```

## 📈 Scaling Strategies

### Horizontal Scaling

1. **Load Balancer Configuration:**
```nginx
upstream backend_servers {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    location /api/ {
        proxy_pass http://backend_servers;
    }
}
```

2. **Database Read Replicas:**
```python
# In backend/app/database.py
from sqlalchemy import create_engine

# Master database for writes
master_engine = create_engine(MASTER_DATABASE_URL)

# Read replica for reads
replica_engine = create_engine(REPLICA_DATABASE_URL)
```

### Auto-scaling with Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: school-management-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: school-management-backend
  template:
    metadata:
      labels:
        app: school-management-backend
    spec:
      containers:
      - name: backend
        image: school-management-backend:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: school-management-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: school-management-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

This deployment guide provides comprehensive coverage of different deployment scenarios. Choose the approach that best fits your infrastructure requirements and scaling needs.
