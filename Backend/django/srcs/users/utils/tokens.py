"""
tokens.py
This file contains modified versions of the PasswordResetTokenGenerator class
from Django. The original version is licensed as follows:

---------------------------
Copyright (c) Django Software Foundation and individual contributors.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

    1. Redistributions of source code must retain the above copyright notice,
       this list of conditions and the following disclaimer.

    2. Redistributions in binary form must reproduce the above copyright
       notice, this list of conditions and the following disclaimer in the
       documentation and/or other materials provided with the distribution.

    3. Neither the name of Django nor the names of its contributors may be used
       to endorse or promote products derived from this software without
       specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
---------------------------

Modifications to the original code are:
- Added functionality to dynamically include user_attributes and keyword arguments
  as well as dynamically change the timeout_setting_name and key_salt.
- The timeout will now be retrieved from a method
- Made it configurable to include the login timestamp in the hash value.
- The docstrings have been updated to reflect the changes.

"""

from django.conf import settings
from django.utils.crypto import constant_time_compare, salted_hmac
from django.utils.http import base36_to_int, int_to_base36

from django.contrib.auth.tokens import PasswordResetTokenGenerator


class GenericTokenGenerator(PasswordResetTokenGenerator):
    """
    Strategy object used to generate and check user specific tokens for different purposes.
    """

    def __init__(self,
                 timeout_setting_name='DEFAULT_TOKEN_TIMEOUT_SECONDS',
                 key_salt=None,
                 **kwargs
        ):
        """
        Base hash data:
        user.pk, timestamp
    
        Keyward arguments:
        user_attributes -- list of user attributes (e.g. is_active) 
                            to include in the hash value (default: [])
        login_timestamp -- include it in the hash value (default: False)
        """
        super().__init__()
        self.timeout_setting_name = timeout_setting_name
        self.key_salt = (
            key_salt
            or 'srcs.users.utils.tokens.GenericTokenGenerator'
        )
        self.user_attributes = kwargs.pop('user_attributes', [])
        self.kwargs = kwargs
    
    def _get_timeout_seconds(self):
        return getattr(settings, self.timeout_setting_name, 60 * 60 * 24)

    def make_token(self, user, **kwargs):
        """
        Return a token that can be used once.
        You can pass additional data to be included in the hash value
        as keyword arguments.
        """
        return self._make_token_with_timestamp(
            user,
            self._num_seconds(self._now()),
            self.secret,
            **kwargs,
        )

    def check_token(self, user, token, **kwargs):
        """
        Check that a token is correct for a given user.
        Pass the same keyword arguments as used to create the token.
        """
        if not (user and token):
            return False
        # Parse the token
        try:
            ts_b36, _ = token.split("-")
        except ValueError:
            return False

        try:
            ts = base36_to_int(ts_b36)
        except ValueError:
            return False

        # Check that the timestamp/uid has not been tampered with
        for secret in [self.secret, *self.secret_fallbacks]:
            if constant_time_compare(
                self._make_token_with_timestamp(
                    user,
                    ts,
                    secret,
                    **kwargs,
                ),
                token,
            ):
                break
        else:
            return False

        # Check the timestamp is within limit.
        if (self._num_seconds(self._now()) - ts) > self._get_timeout_seconds():
            return False

        return True

    def _make_token_with_timestamp(self, user, timestamp, secret, **kwargs):
        # timestamp is number of seconds since 2001-1-1. Converted to base 36,
        # this gives us a 6 digit string until about 2069.
        ts_b36 = int_to_base36(timestamp)
        hash_string = salted_hmac(
            self.key_salt,
            self._make_hash_value(user, timestamp, **kwargs),
            secret=secret,
            algorithm=self.algorithm,
        ).hexdigest()[
            ::2
        ]  # Limit to shorten the URL.
        return "%s-%s" % (ts_b36, hash_string)

    def _make_hash_value(self, user, timestamp, **kwargs):
        """
        Hash the user's primary key and some user state that's sure to change
        to produce a token that is invalidated when it's used:

        Failing those things, the specified timeout from timeout_setting_name
        eventually invalidates the token.
        """

        # Default values for optional keyword arguments
        login_timestamp = ""

        # Include only if asked for in kwargs
        if self.kwargs.pop('login_timestamp', False):
            # Truncate microseconds so that tokens are consistent even if the
            # database doesn't support microseconds.
            login_timestamp = (
                ""
                if user.last_login is None
                else user.last_login.replace(microsecond=0, tzinfo=None)
            )

        # Basic hash data
        hash_data = f"{user.pk}{login_timestamp}{timestamp}"

        # Include data from the user instance as specified in user_attributes
        for attr in self.user_attributes:
            value = getattr(user, attr, "")
            hash_data += f"{value}"

        # Include data from the __init__ kwargs
        for _, value in self.kwargs.items():
            hash_data += f"{value}"

        # Include data from kwargs in (make/check)-token in the hash
        for _, value in kwargs.items():
            hash_data += f"{value}"

        return hash_data


account_activation_token_generator = GenericTokenGenerator(
    timeout_setting_name='ACCOUNT_ACTIVATION_TIMEOUT_SECONDS',
    key_salt='srcs.users.utils.tokens.account_activation_token_generator',
    user_attributes=['is_active', 'is_email_verified', 'email'],
)

change_email_token_generator = GenericTokenGenerator(
    timeout_setting_name='EMAIL_CHANGE_TIMEOUT_SECONDS',
    key_salt='srcs.users.utils.tokens.change_email_token_generator',
    user_attributes=['is_active', 'is_email_verified', 'email', 'password'],
)
