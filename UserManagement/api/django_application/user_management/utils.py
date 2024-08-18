import os
import time
import requests
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import logging

logger = logging.getLogger(__name__)

def get_env_or_file_value(key, default=None):
    try:
        value = os.environ[key]
    except KeyError:
        value = default
    if value and os.path.isfile(value):
        with open(file=value, encoding='utf-8') as file:
            return file.read()
    if value is None:
         raise ValueError(f'Can\'t find value for {key}')
    return value

def avatar_proxy(request):
    # Extract the URL from the request (assuming it's passed as a query parameter)
    url = request.GET.get('url')
    if not url:
        return HttpResponse("URL parameter is missing", status=400)

    try:
        # Fetch data from the given URL
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors

        # Return the fetched data as an HTTP response
        return HttpResponse(response.content, content_type=response.headers['Content-Type'],)
    except requests.RequestException as e:
        return HttpResponse(f"Error fetching data: {e}", status=500)



@csrf_exempt
@staticmethod
def HealthCheckView(request):
    try:
        #time.sleep(10000000) ## For test purpose
        logger.info("Healthcheck passed")
        return JsonResponse({'status': 'OK'}, status=200)
    except Exception as e:
        logger.error(f"Healthcheck failed: {str(e)}")
        return JsonResponse({'status': 'Error', 'message': str(e)}, status=500)