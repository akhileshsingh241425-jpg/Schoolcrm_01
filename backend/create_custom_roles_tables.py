"""Create custom_roles and role_module_permissions tables"""
from app import create_app, db

app = create_app('production')

with app.app_context():
    db.session.execute(db.text("""
        CREATE TABLE IF NOT EXISTS custom_roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            school_id INT NOT NULL,
            name VARCHAR(100) NOT NULL,
            display_name VARCHAR(200),
            description TEXT,
            is_system BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
            UNIQUE KEY unique_school_role_name (school_id, name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """))

    db.session.execute(db.text("""
        CREATE TABLE IF NOT EXISTS role_module_permissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            custom_role_id INT NOT NULL,
            school_id INT NOT NULL,
            module VARCHAR(50) NOT NULL,
            level VARCHAR(20) DEFAULT 'none',
            FOREIGN KEY (custom_role_id) REFERENCES custom_roles(id) ON DELETE CASCADE,
            FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
            UNIQUE KEY unique_role_module (custom_role_id, module)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    """))

    db.session.commit()
    print("✅ Tables created: custom_roles, role_module_permissions")
