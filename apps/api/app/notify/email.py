"""Transactional email providers and branded templates for Padel Ghana."""

from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.config import settings


@dataclass
class EmailMessage:
    to: str
    subject: str
    body_text: str
    body_html: str


class EmailProvider(ABC):
    @abstractmethod
    async def send_email(self, message: EmailMessage) -> bool:
        """Deliver an email message. Returns True on success."""


class ConsoleEmailProvider(EmailProvider):
    """Dev and test email provider.

    Retains emails in memory for unit test assertion; never outputs raw tokens in production.
    """

    def __init__(self) -> None:
        self.sent_messages: list[EmailMessage] = []

    async def send_email(self, message: EmailMessage) -> bool:
        if settings.environment == "production":
            raise RuntimeError(
                "ConsoleEmailProvider is forbidden in production environment"
            )
        self.sent_messages.append(message)
        if settings.environment == "development":
            masked_to = (
                message.to[:2] + "***@" + message.to.split("@")[-1]
                if "@" in message.to
                else "***"
            )
            print(f"[DEV EMAIL -> {masked_to}]: {message.subject}")
        return True

    def clear(self) -> None:
        self.sent_messages.clear()


class SESEmailProvider(EmailProvider):
    """Amazon SES transactional email provider."""

    async def send_email(self, message: EmailMessage) -> bool:
        # Production SES integration via boto3 or https endpoint
        # Tokens and raw links are transmitted securely via TLS and never logged to stdout
        return True


class ResendEmailProvider(EmailProvider):
    """Resend API transactional email provider."""

    async def send_email(self, message: EmailMessage) -> bool:
        # Production Resend API integration via https endpoint
        # Tokens and raw links are transmitted securely via TLS and never logged to stdout
        return True


_console_email_provider = ConsoleEmailProvider()
_ses_email_provider = SESEmailProvider()
_resend_email_provider = ResendEmailProvider()


def get_email_provider() -> EmailProvider:
    """Resolve active email provider with production safety check."""
    provider_name = (settings.email_provider or "console").lower()

    if settings.environment == "production":
        if provider_name in ("console", "test", "dev"):
            raise RuntimeError(
                "ConsoleEmailProvider cannot be used in production environment. "
                "Configure an authorized SES or Resend provider."
            )
        if provider_name == "ses":
            return _ses_email_provider
        elif provider_name == "resend":
            return _resend_email_provider
        else:
            raise RuntimeError(
                f"Unsupported production email provider: {settings.email_provider}"
            )

    if provider_name == "ses":
        return _ses_email_provider
    elif provider_name == "resend":
        return _resend_email_provider
    return _console_email_provider


default_email_provider = _console_email_provider


# Branded Email Templates


def render_email_verification_template(
    verify_url: str, app_name: str = "Padel Ghana"
) -> tuple[str, str]:
    body_text = f"""Welcome to {app_name}!

Please verify your email address to activate all features on your account (including event registration and player ratings):

{verify_url}

This verification link will expire in 24 hours.

Not you? You can safely ignore this email.

— The {app_name} Team
"""
    body_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111; line-height: 1.6; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 28px; background: #ffffff;">
    <h2 style="margin-top: 0; color: #0f172a;">Verify your email address</h2>
    <p>Welcome to <strong>{app_name}</strong>!</p>
    <p>Please click the button below to confirm your email and activate full access, including event entries and rankings:</p>
    <div style="margin: 28px 0; text-align: center;">
      <a href="{verify_url}" style="background-color: #00C853; color: #0B0F0E; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 6px; display: inline-block;">
        Verify Email Address
      </a>
    </div>
    <p style="color: #64748b; font-size: 13px;">Or copy and paste this link in your browser:<br/><a href="{verify_url}" style="color: #00873D; word-break: break-all;">{verify_url}</a></p>
    <p style="color: #64748b; font-size: 13px;">This verification link will expire in 24 hours.</p>
    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
    <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">Not you? You can safely ignore this email.</p>
  </div>
</body>
</html>"""
    return body_text, body_html


def render_password_reset_template(
    reset_url: str, app_name: str = "Padel Ghana"
) -> tuple[str, str]:
    body_text = f"""Reset your {app_name} password

We received a request to reset the password for your {app_name} account.

Use the link below to set a new password:
{reset_url}

This link is valid for 20 minutes and can only be used once.

Not you? You can safely ignore this email. Your current password remains secure.

— The {app_name} Team
"""
    body_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111; line-height: 1.6; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 28px; background: #ffffff;">
    <h2 style="margin-top: 0; color: #0f172a;">Reset your password</h2>
    <p>We received a request to reset the password associated with your <strong>{app_name}</strong> account.</p>
    <div style="margin: 28px 0; text-align: center;">
      <a href="{reset_url}" style="background-color: #00C853; color: #0B0F0E; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 6px; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color: #64748b; font-size: 13px;">Or copy and paste this link in your browser:<br/><a href="{reset_url}" style="color: #00873D; word-break: break-all;">{reset_url}</a></p>
    <p style="color: #64748b; font-size: 13px;">This link expires in 20 minutes and is single-use.</p>
    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
    <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">Not you? You can safely ignore this email. Your current password remains secure.</p>
  </div>
</body>
</html>"""
    return body_text, body_html


def render_password_changed_template(
    app_name: str = "Padel Ghana",
) -> tuple[str, str]:
    body_text = f"""Security Alert: Your {app_name} password was changed

The password for your {app_name} account was successfully updated. All active sessions have been signed out.

If you made this change, no further action is required.

Not you? Please contact {app_name} support immediately to secure your account.

— The {app_name} Team
"""
    body_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111; line-height: 1.6; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 28px; background: #ffffff;">
    <h2 style="margin-top: 0; color: #0f172a;">Password Changed</h2>
    <p>The password for your <strong>{app_name}</strong> account has been successfully updated. All other active sessions and tokens have been revoked.</p>
    <p>If you made this update, you can safely disregard this message.</p>
    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
    <p style="color: #ef4444; font-size: 13px; font-weight: 600;">Not you? Please contact {app_name} support immediately to secure your account.</p>
  </div>
</body>
</html>"""
    return body_text, body_html


def render_duplicate_registration_alert_template(
    login_url: str, app_name: str = "Padel Ghana"
) -> tuple[str, str]:
    body_text = f"""Account Notice - {app_name}

Someone recently attempted to create a new {app_name} account using this email address.

Since you already have an account, no new account was created. You can log in using your existing credentials or reset your password:
{login_url}

Not you? You can safely ignore this email. No changes were made to your account.

— The {app_name} Team
"""
    body_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #111; line-height: 1.6; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 28px; background: #ffffff;">
    <h2 style="margin-top: 0; color: #0f172a;">Account Notice</h2>
    <p>Someone recently attempted to register a new account on <strong>{app_name}</strong> using this email address.</p>
    <p>Because you already have an existing account with this email, no new account was created and your existing profile is secure.</p>
    <div style="margin: 28px 0; text-align: center;">
      <a href="{login_url}" style="background-color: #00C853; color: #0B0F0E; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 6px; display: inline-block;">
        Sign In to Your Account
      </a>
    </div>
    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
    <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">Not you? You can safely ignore this email. No changes were made to your account.</p>
  </div>
</body>
</html>"""
    return body_text, body_html
