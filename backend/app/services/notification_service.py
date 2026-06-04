"""Exam Notification Service — sends alerts and reminders."""
from app import db
from app.models.exam_extended import ExamNotification
from datetime import datetime


def send_notification(school_id, recipient_user_id, type, title, message, exam_id=None, channel='in_app'):
    """Create and send a notification."""
    notif = ExamNotification(
        school_id=school_id,
        exam_id=exam_id,
        recipient_user_id=recipient_user_id,
        type=type,
        title=title,
        message=message,
        delivery_channel=channel,
        delivery_status='sent',
        sent_at=datetime.utcnow(),
    )
    db.session.add(notif)
    db.session.commit()
    return notif


def send_bulk_notifications(school_id, recipient_user_ids, type, title, message, exam_id=None):
    """Send notification to multiple users."""
    notifications = []
    for uid in recipient_user_ids:
        notif = ExamNotification(
            school_id=school_id,
            exam_id=exam_id,
            recipient_user_id=uid,
            type=type,
            title=title,
            message=message,
            delivery_channel='in_app',
            delivery_status='sent',
            sent_at=datetime.utcnow(),
        )
        db.session.add(notif)
        notifications.append(notif)
    db.session.commit()
    return notifications


def send_marks_reminder(school_id, exam_id, teacher_user_ids, subject_name=''):
    """Send marks entry reminder to teachers."""
    title = 'Marks Entry Reminder'
    message = f'Please complete marks entry for {subject_name}. Deadline approaching.'
    return send_bulk_notifications(school_id, teacher_user_ids, 'marks_reminder', title, message, exam_id)


def send_paper_reminder(school_id, exam_id, teacher_user_ids, subject_name=''):
    """Send question paper upload reminder."""
    title = 'Question Paper Reminder'
    message = f'Please upload question paper for {subject_name}. Submission pending.'
    return send_bulk_notifications(school_id, teacher_user_ids, 'paper_reminder', title, message, exam_id)


def send_result_published(school_id, exam_id, parent_user_ids, exam_name=''):
    """Notify parents that results are published."""
    title = 'Exam Results Published'
    message = f'Results for {exam_name} have been published. Please check the portal.'
    return send_bulk_notifications(school_id, parent_user_ids, 'result_published', title, message, exam_id)


def send_duty_notification(school_id, staff_user_id, exam_id, hall_name, date_str):
    """Notify teacher about invigilator duty."""
    title = 'Invigilator Duty Assigned'
    message = f'You have been assigned invigilator duty in {hall_name} on {date_str}.'
    return send_notification(school_id, staff_user_id, 'duty_assigned', title, message, exam_id)


def get_user_notifications(user_id, school_id, unread_only=False, limit=50):
    """Get notifications for a user."""
    query = ExamNotification.query.filter_by(
        recipient_user_id=user_id, school_id=school_id
    )
    if unread_only:
        query = query.filter_by(is_read=False)
    return query.order_by(ExamNotification.created_at.desc()).limit(limit).all()
