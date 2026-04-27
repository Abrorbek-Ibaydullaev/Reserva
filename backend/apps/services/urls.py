from django.urls import path
from . import views

urlpatterns = [
    # Categories
    path('categories/', views.CategoryListView.as_view(), name='category-list'),

    # Business owner services
    path('my-services/', views.BusinessOwnerServiceListView.as_view(),
         name='business-owner-service-list'),
    path('my-services/<int:pk>/', views.BusinessOwnerServiceDetailView.as_view(),
         name='business-owner-service-detail'),

    # Addons
    path('<int:service_id>/addons/',
         views.ServiceAddonListView.as_view(), name='service-addon-list'),

    # Services
    path('', views.ServiceListView.as_view(), name='service-list'),
    path('id/<int:pk>/', views.ServiceDetailByIdView.as_view(), name='service-detail-by-id'),

    # Reviews (by ID for frontend use)
    path('id/<int:pk>/reviews/', views.ServiceReviewByIdView.as_view(),
         name='service-review-by-id'),

    # Reviews (by slug)
    path('<slug:slug>/reviews/', views.ServiceReviewListView.as_view(),
         name='service-review-list'),
    path('<slug:slug>/', views.ServiceDetailView.as_view(), name='service-detail'),
]
