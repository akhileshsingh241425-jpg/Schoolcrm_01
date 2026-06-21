"""Migration: Add subscription_feature_addons table and new columns to school_subscriptions/subscription_payments"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app import db, create_app
from app.models.subscription import SubscriptionFeatureAddOn, SchoolSubscription, SubscriptionPayment

app = create_app('default')

with app.app_context():
    # Create the new subscription_feature_addons table
    db.create_all()
    
    # Add new columns to existing tables if they don't exist
    # Check and add addon_amount column to school_subscriptions
    try:
        result = db.session.execute(db.text("SELECT addon_amount FROM school_subscriptions LIMIT 1"))
        print("addon_amount column already exists in school_subscriptions")
    except Exception:
        db.session.execute(db.text(
            "ALTER TABLE school_subscriptions ADD COLUMN addon_amount NUMERIC(12,2) DEFAULT 0"
        ))
        print("Added addon_amount column to school_subscriptions")
    
    # Check and add total_amount column to school_subscriptions
    try:
        result = db.session.execute(db.text("SELECT total_amount FROM school_subscriptions LIMIT 1"))
        print("total_amount column already exists in school_subscriptions")
    except Exception:
        db.session.execute(db.text(
            "ALTER TABLE school_subscriptions ADD COLUMN total_amount NUMERIC(12,2) DEFAULT 0"
        ))
        print("Added total_amount column to school_subscriptions")
    
    # Check and add updated_at column to school_subscriptions
    try:
        result = db.session.execute(db.text("SELECT updated_at FROM school_subscriptions LIMIT 1"))
        print("updated_at column already exists in school_subscriptions")
    except Exception:
        db.session.execute(db.text(
            "ALTER TABLE school_subscriptions ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP"
        ))
        print("Added updated_at column to school_subscriptions")
    
    # Check and add payment_type column to subscription_payments
    try:
        result = db.session.execute(db.text("SELECT payment_type FROM subscription_payments LIMIT 1"))
        print("payment_type column already exists in subscription_payments")
    except Exception:
        db.session.execute(db.text(
            """ALTER TABLE subscription_payments ADD COLUMN payment_type 
            ENUM('subscription', 'recharge', 'addon') DEFAULT 'subscription'"""
        ))
        print("Added payment_type column to subscription_payments")
    
    # Check and add updated_at column to subscription_plans
    try:
        result = db.session.execute(db.text("SELECT updated_at FROM subscription_plans LIMIT 1"))
        print("updated_at column already exists in subscription_plans")
    except Exception:
        db.session.execute(db.text(
            "ALTER TABLE subscription_plans ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        ))
        print("Added updated_at column to subscription_plans")
    
    # Check and add created_at column to subscription_plans
    try:
        result = db.session.execute(db.text("SELECT created_at FROM subscription_plans LIMIT 1"))
        print("created_at column already exists in subscription_plans")
    except Exception:
        db.session.execute(db.text(
            "ALTER TABLE subscription_plans ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"
        ))
        print("Added created_at column to subscription_plans")
    
    # Update total_amount for existing subscriptions where it's 0
    subs = SchoolSubscription.query.filter(SchoolSubscription.total_amount == 0).all()
    for sub in subs:
        addon_sum = db.session.query(db.func.coalesce(db.func.sum(SubscriptionFeatureAddOn.price), 0)).filter(
            SubscriptionFeatureAddOn.subscription_id == sub.id,
            SubscriptionFeatureAddOn.is_active == True
        ).scalar()
        sub.addon_amount = addon_sum
        sub.total_amount = float(sub.amount or 0) + float(addon_sum or 0)
    db.session.commit()
    print(f"Updated total_amount for {len(subs)} existing subscriptions")
    
    print("\nMigration completed successfully!")