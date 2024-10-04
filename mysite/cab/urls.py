from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("cab", views.cab, name="cab"),
    path("cplxaction", views.cplxaction, name="cplxaction"),
    path("uploaddb", views.uploaddb, name="uploaddb"),
    path("getactions", views.getactions, name="getactions"),
    path("loadcplxaction", views.loadcplxaction, name="loadcplxaction"),
    path("getcplxaction", views.getcplxaction, name="getcplxaction")
]