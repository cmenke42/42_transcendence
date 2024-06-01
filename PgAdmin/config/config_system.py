# # Some options to consider:


# #############################################################################
# # AUTO_DISCOVER_SERVERS setting is used to enable the pgAdmin to discover the
# # database server automatically on the local machine.
# # When it is set to False, pgAdmin will not discover servers installed on
# # the local machine.
# #############################################################################
# AUTO_DISCOVER_SERVERS = True


# # External Authentication Sources
# ##########################################################################

# # Default setting is internal
# # External Supported Sources: ldap, kerberos, oauth2
# # Multiple authentication can be achieved by setting this parameter to
# # ['ldap', 'internal'] or ['oauth2', 'internal'] or
# # ['webserver', 'internal'] etc.
# # pgAdmin will authenticate the user with ldap/oauth2 whatever first in the
# # list, in case of failure the second authentication option will be considered.

# AUTHENTICATION_SOURCES = ['internal']

# # USER_INACTIVITY_TIMEOUT is interval in Seconds. If the pgAdmin screen is left
# # unattended for <USER_INACTIVITY_TIMEOUT> seconds then the user will
# # be logged out. When set to 0, the timeout will be disabled.
# # If pgAdmin doesn't detect any activity in the time specified (in seconds),
# # the user will be forcibly logged out from pgAdmin. Set to zero to disable
# # the timeout.
# # Note: This is applicable only for SERVER_MODE=True.
USER_INACTIVITY_TIMEOUT = 600


# ##########################################################################
# # Mail server settings
# ##########################################################################

# # These settings are used when running in web server mode for confirming
# # and resetting passwords etc.
# # See: http://pythonhosted.org/Flask-Mail/ for more info
# MAIL_SERVER = 'localhost'
# MAIL_PORT = 25
# MAIL_USE_SSL = False
# MAIL_USE_TLS = False
# MAIL_USERNAME = ''
# MAIL_PASSWORD = ''
# MAIL_DEBUG = False

# # Flask-Security overrides Flask-Mail's MAIL_DEFAULT_SENDER setting, so
# # that should be set as such:
# SECURITY_EMAIL_SENDER = 'no-reply@localhost'

# ##########################################################################
# # Mail content settings
# ##########################################################################

# # These settings define the content of password reset emails
# SECURITY_EMAIL_SUBJECT_PASSWORD_RESET = "Password reset instructions for %s" \
#                                         % APP_NAME
# SECURITY_EMAIL_SUBJECT_PASSWORD_NOTICE = "Your %s password has been reset" \
#                                          % APP_NAME
# SECURITY_EMAIL_SUBJECT_PASSWORD_CHANGE_NOTICE = \
#     "Your password for %s has been changed" % APP_NAME

# ##########################################################################
# # Email address validation
# ##########################################################################
# CHECK_EMAIL_DELIVERABILITY = False
# SECURITY_EMAIL_VALIDATOR_ARGS = \
#     {"check_deliverability": CHECK_EMAIL_DELIVERABILITY}






# # An optional login banner to show security warnings/disclaimers etc. at
# # login and password recovery etc. HTML may be included for basic formatting,
# # For example:
# # LOGIN_BANNER = "<h4>Authorised Users Only!</h4>" \
# #                "Unauthorised use is strictly forbidden."
# LOGIN_BANNER = ""




# # Data directory for storage of config settings etc. This shouldn't normally
# # need to be changed - it's here as various other settings depend on it.
# # On Windows, we always store data in %APPDATA%\$(APP_WIN_PATH). On other
# # platforms, if we're in server mode we use /var/lib/$(APP_PATH),
# # otherwise ~/.$(APP_PATH)
# if IS_WIN:
#     # Use the short path on windows
#     DATA_DIR = os.path.realpath(
#         os.path.join(fs_short_path(env('APPDATA')), APP_WIN_PATH)
#     )
# else:
#     if SERVER_MODE:
#         DATA_DIR = os.path.join('/var/lib/', APP_PATH)
#     else:
#         DATA_DIR = os.path.realpath(
#             os.path.expanduser('~/' + '.' + APP_PATH + '/')
#         )


# # This param is used to validate ALLOWED_HOSTS for the application
# # This will be used to avoid Host Header Injection attack
# # ALLOWED_HOSTS = ['225.0.0.0/8', '226.0.0.0/7', '228.0.0.0/6']
# # ALLOWED_HOSTS = ['127.0.0.1', '192.168.0.1']
# # if ALLOWED_HOSTS= [] then it will accept all ips (and application will be
# # vulnerable to Host Header Injection attack)
ALLOWED_HOSTS = ['127.0.0.1', 'localhost']


# # STRICT_TRANSPORT_SECURITY_ENABLED when set to True will set the
# # Strict-Transport-Security header
# STRICT_TRANSPORT_SECURITY_ENABLED = False

# # The Strict-Transport-Security header tells the browser to convert all HTTP
# # requests to HTTPS, preventing man-in-the-middle (MITM) attacks.
# # e.g. 'max-age=31536000; includeSubDomains'
# STRICT_TRANSPORT_SECURITY = "max-age=31536000; includeSubDomains"


# # This option allows the user to host the application on a LAN
# # Default hosting is on localhost (DEFAULT_SERVER='localhost').
# # To host pgAdmin4 over LAN set DEFAULT_SERVER='0.0.0.0' (or a specific
# # adaptor address.
# # NOTE: This is NOT recommended for production use, only for debugging
# # or testing. Production installations should be run as a WSGI application
# # behind Apache HTTPD.
# DEFAULT_SERVER = '0.0.0.0'

# # The default port on which the app server will listen if not set in the
# # environment by the runtime
# DEFAULT_SERVER_PORT = 5050
