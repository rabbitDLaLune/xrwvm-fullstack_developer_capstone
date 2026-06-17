
from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponseRedirect, HttpResponse, JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth import login, logout, authenticate
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from .models import CarMake, CarModel
from .populate import initiate
from django.http import JsonResponse
from .restapis import get_request, analyze_review_sentiments, post_review
from datetime import datetime
import logging
import json

from .populate import initiate


# Get an instance of a logger
logger = logging.getLogger(__name__)


# Create a login view to handle sign-in requests
@csrf_exempt
def login_user(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)

            username = data["userName"]
            password = data["password"]

            user = authenticate(
                request,
                username=username,
                password=password
            )

            if user is not None:
                login(request, user)

                return JsonResponse({
                    "userName": username,
                    "status": "Authenticated"
                })

            return JsonResponse({
                "userName": username,
                "status": "Unauthenticated"
            })

        except (json.JSONDecodeError, KeyError):
            return JsonResponse({
                "userName": "",
                "status": "Invalid request"
            }, status=400)

    return JsonResponse({
        "userName": "",
        "status": "Method not allowed"
    }, status=405)


# Create a logout view to handle sign-out requests
def logout_request(request):
    if request.method == "GET":
        # Terminate the current user's session
        logout(request)

        # Return an empty username
        data = {
            "userName": ""
        }

        return JsonResponse(data)

    return JsonResponse({
        "userName": "",
        "status": "Method not allowed"
    }, status=405)


# Create a registration view to handle sign-up requests
@csrf_exempt
def registration(request):
    context = {}

	# Load JSON data from the request body
    data = json.loads(request.body)
    username = data['userName']
    password = data['password']
    first_name = data['firstName']
    last_name = data['lastName']
    email = data['email']
    username_exist = False
    email_exist = False
    try:
        # Check if user already exists
        User.objects.get(username=username)
        username_exist = True
    except:
        # If not, simply log this is a new user
        logger.debug("{} is new user".format(username))

    # If it is a new user
    if not username_exist:
        # Create user in auth_user table
        user = User.objects.create_user(username=username, first_name=first_name, last_name=last_name,password=password, email=email)
        # Login the user and redirect to list page
        login(request, user)
        data = {"userName":username,"status":"Authenticated"}
        return JsonResponse(data)
    else :
        data = {"userName":username,"error":"Already Registered"}
        return JsonResponse(data)

def get_cars(request):
    count = CarMake.objects.count()

    if count == 0:
        initiate()

    car_models = CarModel.objects.select_related("car_make")
    cars = []

    for car_model in car_models:
        cars.append({
            "CarModel": car_model.name,
            "CarMake": car_model.car_make.name,
        })

    return JsonResponse({"CarModels": cars})

# Update the get_dealerships view to render the index page
# with a list of dealerships
# Return all dealerships by default, or dealerships from a specific state
def get_dealerships(request, state="All"):
    if state == "All":
        endpoint = "/fetchDealers"
    else:
        endpoint = "/fetchDealers/" + state

    dealerships = get_request(endpoint)

    return JsonResponse({
        "status": 200,
        "dealers": dealerships
    })


# Create a get_dealer_reviews view to render dealer reviews
# Return reviews for one dealer with sentiment analysis
def get_dealer_reviews(request, dealer_id):
    endpoint = "/fetchReviews/dealer/" + str(dealer_id)
    reviews = get_request(endpoint)

    review_details = []

    if reviews:
        for review in reviews:
            review_detail = review.copy()

            sentiment_result = analyze_review_sentiments(
                review.get("review", "")
            )

            if sentiment_result:
                review_detail["sentiment"] = sentiment_result.get(
                    "sentiment",
                    "neutral"
                )
            else:
                review_detail["sentiment"] = "neutral"

            review_details.append(review_detail)

    return JsonResponse({
        "status": 200,
        "reviews": review_details
    })


# Create a get_dealer_details view to render dealer details
# Return the details of one dealer
def get_dealer_details(request, dealer_id):
    endpoint = "/fetchDealer/" + str(dealer_id)
    dealer = get_request(endpoint)

    return JsonResponse({
        "status": 200,
        "dealer": dealer
    })


# Create an add_review view to submit a review
def add_review(request):
    if request.user.is_anonymous == False:
        data = json.loads(request.body)

        try:
            response = post_review(data)
            print(response)

            return JsonResponse({
                "status": 200
            })
        except Exception as error:
            print(error)

            return JsonResponse({
                "status": 401,
                "message": "Error in posting review"
            })
    else:
        return JsonResponse({
            "status": 403,
            "message": "Unauthorized"
        })

