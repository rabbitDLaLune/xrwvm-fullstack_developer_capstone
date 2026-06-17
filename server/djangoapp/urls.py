from django.urls import path
from django.conf.urls.static import static
from django.conf import settings
from . import views

app_name = 'djangoapp'

urlpatterns = [
    # Path for registration
    path(
        route='registration',
        view=views.registration,
        name='registration'
    ),

    # Path for login
    path(
        route='login',
        view=views.login_user,
        name='login'
    ),

    # Path for logout
    path(
        route='logout',
        view=views.logout_request,
        name='logout'
    ),

    path(
    route="get_cars",
    view=views.get_cars,
    name="getcars",
    ),

    # Path for dealer reviews view

    # Path for adding a review view

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)