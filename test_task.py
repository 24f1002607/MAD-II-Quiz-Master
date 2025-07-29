from application.tasks.reminder import send_daily_reminders

if __name__ == "__main__":
    result = send_daily_reminders.delay()  # Trigger the task asynchronously
    print(f"Task triggered with id: {result.id}")
