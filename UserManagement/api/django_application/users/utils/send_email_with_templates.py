from typing import Optional

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template import TemplateDoesNotExist, TemplateSyntaxError
from django.template.loader import render_to_string

from .exceptions import EmailSendingFailed

def send_email_with_templates(
    subject: str,
    body: str = "",
    from_email: Optional[str] = None,
    to: Optional[str] = None,
    html_message_template_name: Optional[str] = None,
    text_message_template_name: Optional[str] = None,
    context: Optional[dict] = None,
):
    """
    Send email to a recipient.
    Context for templates can be passed as dictionary.
    """
    from_email = from_email or settings.DEFAULT_FROM_EMAIL
    to = to or ""
    context = context or {}
    context['email_subject'] = subject

    # If a text message template is provided, render it
    if text_message_template_name:
        try:
            body = render_to_string(text_message_template_name, context)
        except (TemplateDoesNotExist, TemplateSyntaxError) as e:
            raise EmailSendingFailed(f"Error rendering text message template: {e}") from e

    email = EmailMultiAlternatives(subject, body, from_email, [to])

    if html_message_template_name and not (text_message_template_name or body):
        raise EmailSendingFailed(
            "If you provide an HTML template, "
            "you also need to provide the text message as an alternative."
        )
    elif html_message_template_name:
        try:
            html_message = render_to_string(html_message_template_name, context)
            email.attach_alternative(html_message, "text/html")
        except (TemplateDoesNotExist, TemplateSyntaxError) as e:
            raise EmailSendingFailed(f"Error rendering HTML message template: {e}") from e

    try:
        email.send()
    except Exception as e:
        raise EmailSendingFailed(f"Failed to send email: {e}") from e
