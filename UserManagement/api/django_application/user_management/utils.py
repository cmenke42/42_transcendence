import os

def get_env_or_file_value(key, default=None):
    try:
        value = os.environ[key]
    except KeyError:
        value = default
    if value and os.path.isfile(value):
        with open(file=value, encoding='utf-8') as file:
            return file.read()
    return value