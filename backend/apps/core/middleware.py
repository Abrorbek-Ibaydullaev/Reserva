"""Subdomain routing middleware.

Routes requests arriving on the ``admin.`` subdomain (e.g.
``admin.reserva.services``) to the Django admin site, so visiting the bare
subdomain root lands on the admin index instead of the public API root.
"""

from django.http import HttpResponseRedirect


class SubdomainAdminMiddleware:
    """Redirect ``admin.*`` subdomain traffic to the Django admin.

    When a request's host starts with ``admin.`` and the path is not already
    under ``/admin``, the visitor is redirected to ``/admin/`` so the admin
    index (login) is shown. Requests to any other host pass through untouched,
    as do requests on the admin subdomain that are already under ``/admin``
    (which lets the admin's own static assets and sub-pages resolve normally).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # request.get_host() may include a port (e.g. "admin.localhost:8000");
        # strip it before matching the subdomain prefix.
        host = request.get_host().split(":")[0]

        if host.startswith("admin.") and not request.path.startswith("/admin"):
            # Relative redirect keeps the visitor on the same admin.* host.
            return HttpResponseRedirect("/admin/")

        return self.get_response(request)
