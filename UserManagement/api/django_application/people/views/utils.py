from django.core.mail import EmailMessage
import threading

class EmailThread(threading.Thread):

    def __init__(self, email):
        self.email = email
        threading.Thread.__init__(self)

    def run(self):
        self.email.send()

# class Util:
#     @staticmethod
#     def send_email(data):
#         email = EmailMessage(
#             subject=data['email_subject'], body=data['email_body'], to=[data['to_email']])
#         EmailThread(email).start()




from email.message import EmailMessage
import smtplib

class Util:
    @staticmethod
    def send_email(data):
        sender_email = "noreply@example.com"  # Replace with a valid sender email address
        recipient_email = data['to_email']
        email_subject = data['email_subject']
        email_body = data['email_body']

        email = EmailMessage()
        email['Subject'] = email_subject
        email['From'] = sender_email
        email['To'] = recipient_email
        email.set_content(email_body)

        try:
            with smtplib.SMTP('localhost') as smtp:
                smtp.send_message(email)
            print(f"Email sent to {recipient_email}")
        except smtplib.SMTPRecipientsRefused as e:
            print(f"Recipients refused: {str(e)}")
        except Exception as e:
            print(f"An error occurred: {str(e)}")