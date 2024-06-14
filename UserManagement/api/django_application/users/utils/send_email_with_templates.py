from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.template import TemplateDoesNotExist, TemplateSyntaxError
from django.conf import settings

from .exceptions import EmailSendingFailed

def send_email_with_templates(
        subject, message=None,
        from_email=None, recipient_list=None,
        html_message_template_name=None, text_message_template_name=None,
        context=None,
    ):
    """
    Send emails to a list of recipients.
    Context for templates can be passed as dictionary.
    """

    from_email = from_email or settings.DEFAULT_FROM_EMAIL
    recipient_list = recipient_list or []
    context = context or {}
    context['email_subject'] = subject

    try:
        if text_message_template_name:
            message = render_to_string(text_message_template_name, context)
    except (TemplateDoesNotExist, TemplateSyntaxError) as e:
        raise EmailSendingFailed(f"Error rendering text message template: {e}") from e

    email = EmailMultiAlternatives(subject, message,from_email, recipient_list)

    try:
        if html_message_template_name:
            html_message = render_to_string(html_message_template_name, context)
            email.attach_alternative(html_message, "text/html")
    except (TemplateDoesNotExist, TemplateSyntaxError) as e:
        raise EmailSendingFailed(f"Error rendering HTML message template: {e}") from e

    try:
        email.send()
    except Exception as e:
        raise EmailSendingFailed(f"Failed to send email: {e}") from e
