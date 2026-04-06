#!/bin/bash
# ============================================
# School CRM - Hostinger VPS Deployment Script
# Run as root: sudo bash deploy.sh
# ============================================

set -e

DOMAIN="your-domain.com"  # <-- CHANGE THIS
PORT=4000  # Backend port (5000 is occupied)
APP_DIR="/var/www/school-crm"
REPO_URL="https://github.com/akhileshsingh241425-jpg/Schoolcrm_01.git"

echo "=========================================="
echo " School CRM - Hostinger VPS Deployment"
echo "=========================================="

# 1. System Update & Install Dependencies
echo "[1/8] Installing system dependencies..."
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv nginx mysql-server git curl

# 2. Setup MySQL Database
echo "[2/8] Setting up MySQL database..."
mysql -e "CREATE DATABASE IF NOT EXISTS school_crm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS 'school_crm_user'@'localhost' IDENTIFIED BY 'CHANGE_THIS_PASSWORD';"
mysql -e "GRANT ALL PRIVILEGES ON school_crm.* TO 'school_crm_user'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"
echo "  -> Database 'school_crm' created"

# 3. Clone Repository
echo "[3/8] Cloning project..."
mkdir -p $APP_DIR
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR && git pull origin main
else
    git clone $REPO_URL $APP_DIR
fi

# 4. Backend Setup
echo "[4/8] Setting up Python backend..."
cd $APP_DIR/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn pymysql

# Copy production .env
if [ ! -f .env ]; then
    cp $APP_DIR/deploy/.env.production .env
    echo "  -> IMPORTANT: Edit $APP_DIR/backend/.env with your actual credentials!"
fi

# Create uploads directory
mkdir -p uploads
chown -R www-data:www-data uploads

# Create log directory
mkdir -p /var/log/school-crm
chown -R www-data:www-data /var/log/school-crm

# 5. Initialize Database Tables
echo "[5/8] Initializing database tables..."
cd $APP_DIR/backend
source venv/bin/activate
python -c "from app import create_app, db; app = create_app('production'); app.app_context().push(); db.create_all(); print('  -> Tables created')"

# Run seed scripts
cd $APP_DIR
python setup_rbac.py 2>/dev/null || echo "  -> RBAC already set"
python seed_dummy_data.py 2>/dev/null || echo "  -> Seed data already exists"

# 6. Frontend - Build is already in repo, just set permissions
echo "[6/8] Setting up frontend..."
# If you need to rebuild:
# cd $APP_DIR/frontend
# apt install -y nodejs npm
# npm install
# REACT_APP_API_URL=https://$DOMAIN/api npm run build
chown -R www-data:www-data $APP_DIR/frontend/build

# 7. Nginx Configuration
echo "[7/8] Configuring Nginx..."
cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/school-crm
sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/school-crm
ln -sf /etc/nginx/sites-available/school-crm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "  -> Nginx configured for $DOMAIN"

# 8. Gunicorn Systemd Service
echo "[8/8] Setting up Gunicorn service..."
cp $APP_DIR/deploy/school-crm.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable school-crm
systemctl start school-crm
echo "  -> Gunicorn service started"

# Set ownership
chown -R www-data:www-data $APP_DIR

echo ""
echo "=========================================="
echo " DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo " Next Steps:"
echo " 1. Edit $APP_DIR/backend/.env with real credentials"
echo " 2. Point your domain DNS to this server IP"
echo " 3. Install SSL: sudo apt install certbot python3-certbot-nginx"
echo "    Then: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo " 4. Restart: sudo systemctl restart school-crm"
echo ""
echo " Useful Commands:"
echo "   sudo systemctl status school-crm    # Check status"
echo "   sudo systemctl restart school-crm   # Restart backend"
echo "   sudo journalctl -u school-crm -f    # View logs"
echo "   sudo tail -f /var/log/school-crm/error.log"
echo ""
