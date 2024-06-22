from unittest.mock import patch, create_autospec

from django.conf import settings
from django.core import mail
from django.template import TemplateDoesNotExist, TemplateSyntaxError
from django.test import SimpleTestCase
from users.utils.exceptions import EmailSendingFailed
from users.utils.send_email_with_templates import send_email_with_templates
from django.template.loader import render_to_string


class SendEmailWithTemplatesTest(SimpleTestCase):
    def setUp(self):
        self.subject = "Test Subject"
        self.message = "Test Message"
        self.from_email = "from@example.com"
        self.to = "to@example.com"
        self.context = {"some_data": "value"}

    def test_default_from_email(self):
        send_email_with_templates(
            self.subject,
            self.message,
            to=self.to,
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].from_email, settings.DEFAULT_FROM_EMAIL)
    
    def test_from_email(self):
        send_email_with_templates(
            self.subject,
            self.message,
            from_email=self.from_email,
            to=self.to,
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].from_email, self.from_email)
    
    def test_default_recipient(self):
        send_email_with_templates(
            self.subject,
            self.message,
            from_email=self.from_email,
        )
        self.assertEqual(len(mail.outbox), 0)
    
    def test_single_recipient(self):
        send_email_with_templates(
            self.subject,
            self.message,
            from_email=self.from_email,
            to=self.to,
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.to])
    
    def test_default_context(self):
        send_email_with_templates(
            self.subject,
            self.message,
            from_email=self.from_email,
            to=self.to,
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, self.subject)

    def test_normal_message(self):
        send_email_with_templates(
            self.subject,
            self.message,
            from_email=self.from_email,
            to=self.to,
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].body, self.message)
    
    def test_text_message_template(self):
        send_email_with_templates(
            self.subject,
            text_message_template_name="users/email/tests/test_text_template.txt",
            from_email=self.from_email,
            to=self.to,
        )
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, self.subject)
    

    def test_html_message_template_text_alternative_exceptions(self):
        with self.subTest("No text alternative"):
            with self.assertRaises(EmailSendingFailed):
                send_email_with_templates(
                    self.subject,
                    html_message_template_name="users/email/tests/test_html_template.html",
                    from_email=self.from_email,
                    to=self.to,
                )
        with self.subTest("plain message as alternative"):
            send_email_with_templates(
                self.subject,
                body=self.message,
                html_message_template_name="users/email/tests/test_html_template.html",
                from_email=self.from_email,
                to=self.to,
            )
        with self.subTest("text template as alternative"):
            send_email_with_templates(
                self.subject,
                text_message_template_name="users/email/tests/test_text_template.txt",
                html_message_template_name="users/email/tests/test_html_template.html",
                from_email=self.from_email,
                to=self.to,
            )

    def test_template_does_not_exist(self):
        with self.subTest("Text template"):
            self.run_subtest_template_exceptions(
                "users/email/tests/non_existent_template.txt",
                TemplateDoesNotExist
            )
        with self.subTest("HTML template"):
            self.run_subtest_template_exceptions(
                "users/email/tests/non_existent_template.html",
                TemplateDoesNotExist
            )

    def test_template_syntax_error(self):
        mock_render_to_string = create_autospec(
            render_to_string,
            side_effect=TemplateSyntaxError("Some render error")
            )
        with patch('users.utils.send_email_with_templates.render_to_string', new=mock_render_to_string):
            with self.subTest("Text template"):
                self.run_subtest_template_exceptions(
                    "users/email/tests/test_text_template.txt",
                    TemplateSyntaxError
                )
            with self.subTest("HTML template"):
                self.run_subtest_template_exceptions(
                    "users/email/tests/test_html_template.html",
                    TemplateSyntaxError
                )

    def run_subtest_template_exceptions(self, template_name, exception_type):
        with self.assertRaises(EmailSendingFailed) as cm:
            send_email_with_templates(
                self.subject,
                text_message_template_name=template_name,
                context=self.context,
                from_email=self.from_email,
                to=self.to,
            )
        self.assertIsInstance(cm.exception.__cause__, exception_type)
