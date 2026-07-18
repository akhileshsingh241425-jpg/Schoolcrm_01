# ============================================
# School CRM - Secure Deployment Instructions
# Server: 93.127.194.235
# ============================================

## 1. Server Security (run as root)

### 1.1 Update system
```bash
apt update && apt upgrade -y
```

### 1.2 Configure Firewall (UFW)
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp          # SSH
ufw allow 80/tcp          # HTTP (Nginx)
ufw allow 443/tcp         # HTTPS (optional)
ufw --force enable
```

### 1.3 Disable root SSH login
Edit `/etc/ssh/sshd_config`:
```
PermitRootLogin no
PasswordAuthentication no
```
```bash
systemctl restart sshd
```

### 1.4 Create deploy user
```bash
adduser deployer
usermod -aG sudo deployer
```

### 1.5 Secure MySQL
```bash
mysql_secure_installation
```
Then:
```sql
ALTER USER 'rohit'@'localhost' IDENTIFIED BY 'rohit0101';
FLUSH PRIVILEGES;
```

---

## 2. Deploy Application

### 2.1 Clone and setup
```bash
mkdir -p /var/www/school-crm
git clone https://github.com/akhileshsingh241425-jpg/Schoolcrm_01.git /var/www/school-crm
cd /var/www/school-crm/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn pymysql
```

### 2.2 Setup .env
```bash
cp /var/www/school-crm/deploy/.env.production /var/www/school-crm/backend/.env
# Auto-generate SECRET_KEY and JWT_SECRET_KEY
cd /var/www/school-crm/backend
SECRET_KEY=$(openssl rand -hex 64)
JWT_SECRET_KEY=$(openssl rand -hex 32)
sed -i "s/^SECRET_KEY=$/SECRET_KEY=$SECRET_KEY/" .env
sed -i "s/^JWT_SECRET_KEY=$/JWT_SECRET_KEY=$JWT_SECRET_KEY/" .env
chmod 640 .env
```

### 2.3 Initialize database
```bash
cd /var/www/school-crm/backend
source venv/bin/activate
# Run schema.sql to create tables
mysql -u rohit -p rohit0101 rohit0101 < /var/www/school-crm/database/schema.sql
```

### 2.4 Setup Nginx
```bash
cp /var/www/school-crm/deploy/nginx.conf /etc/nginx/sites-available/school-crm
ln -sf /etc/nginx/sites-available/school-crm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 2.5 Setup Gunicorn service
```bash
cp /var/www/school-crm/deploy/school-crm.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable school-crm
systemctl start school-crm
```

### 2.6 Set permissions
```bash
mkdir -p /var/www/school-crm/backend/uploads
mkdir -p /var/log/school-crm
chown -R www-data:www-data /var/www/school-crm
chown -R www-data:www-data /var/log/school-crm
chmod 750 /var/www/school-crm/backend/.env
```

---

## 3. Post-Deployment Security

### 3.1 Setup SSL (HTTPS)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d 93.127.194.235
```
After certbot completes, verify `/etc/nginx/sites-available/school-crm` has the
SSL paths correct (certbot updates them automatically). The nginx config in
`deploy/nginx.conf` already includes the HTTPS server block and HSTS headers.

### 3.2 Enable unattended security updates
```bash
apt install -y unattended-upgrades
dpkg-reconfigure --priority=low unattended-upgrades
```

### 3.3 Setup fail2ban
```bash
apt install -y fail2ban
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
systemctl enable fail2ban
systemctl start fail2ban
```

### 3.4 Setup logrotate
```bash
cat > /etc/logrotate.d/school-crm << 'EOF'
/var/log/school-crm/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
EOF
```

### 3.5 Remove test files
```bash
rm -rf /var/www/school-crm/e2e-tests
rm -rf /var/www/school-crm/backend/tests
rm -f /var/www/school-crm/playwright.config.js
```

---

## 4. Monitor

### 4.1 Check status
```bash
systemctl status school-crm
journalctl -u school-crm -f
```

### 4.2 Check logs
```bash
tail -f /var/log/school-crm/error.log
tail -f /var/log/school-crm/access.log
```

### 4.3 Watch system resources
```bash
htop
```

---

## 5. Quick Commands

| Action | Command |
|--------|---------|
| Restart backend | `systemctl restart school-crm` |
| Reload Nginx | `nginx -t && systemctl reload nginx` |
| View errors | `journalctl -u school-crm -f` |
| Deploy update | `cd /var/www/school-crm && git pull origin main && systemctl restart school-crm` |
