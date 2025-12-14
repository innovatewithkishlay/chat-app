self.addEventListener("push", function (event) {
    const data = event.data.json();
    const title = data.title || "New Message";
    const options = {
        body: data.body || "You have a new message.",
        icon: data.icon || "/vite.svg",
        badge: "/vite.svg",
        data: {
            url: data.url || "/",
        },
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
            // If a window is already open, focus it
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url.includes(event.notification.data.url) && "focus" in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
