from django.urls import path

from apps.webhooks.views import ResendInboundWebhookView

urlpatterns = [
    path(
        "resend-inbound/",
        ResendInboundWebhookView.as_view(),
        name="webhooks-resend-inbound",
    ),
]
