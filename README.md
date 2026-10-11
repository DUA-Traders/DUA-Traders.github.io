# DUA Traders - Wholesale Food & Condiments Distributor

Official website and digital wholesale catalog for **DUA Traders** (Bulk Orders & Retail Supply).

🌐 **Live Website**: [https://DUA-Traders.github.io/](https://DUA-Traders.github.io/)

### Product Catalog (13 Items)
1. Delish BBQ Sauce 4L (Commercial Jug)
2. Delish Chilli Garlic Sauce 4L (Commercial Jug)
3. Delish Classic Mayonnaise 4L (Commercial Jug)
4. Delish Green Chili Sauce 4L (Commercial Jug)
5. Delish Pizza Sauce 4L (Commercial Jug)
6. Delish Pizza Sauce 4L (Spout Pouch)
7. Delish Real Mayonnaise Sauce 4L (Spout Pouch)
8. Delish Soy Sauce 4L (Commercial Jug)
9. Delish Tomato Ketchup 4L (Spout Pouch)
10. Mozzarella Cheese Block (High Stretch)
11. Pure Traditional Desi Ghee
12. Farm White Eggs (30-Egg Kraft Carton)
13. Delish Vinegar 4L Bottle

### Direct Inquiries & Ordering
* **Phone**: [0306 0824762](tel:03060824762)
* **WhatsApp**: [+92 306 0824762](https://wa.me/923060824762)
* **Portfolio**: https://murtuzadeveloper.github.io/

---

### Live Visitor Statistics System
The website features a live visitor traffic analytics section in the footer tracking 4 metrics:
1. **Total Visitors**: All-time deduplicated unique visitors (identified via an anonymous browser UUID in `localStorage`).
2. **Today's Visitors**: Unique visitors today, reset automatically at `00:00:00 PKT` (Pakistan Standard Time, UTC+5).
3. **Online Visitors**: Currently active visitors calculated within a 5-minute activity window.
4. **Total Page Views**: Total visits to the wholesale catalog.

#### Architecture & Configuration (`visitor-counter-config.js`)
* **Zero-Setup Mode (Default)**: Out-of-the-box tracking using CountAPI (`https://countapi.mileshilliard.com/api/v1`) with local session presence. No API keys or backend servers required.
* **Firebase Realtime Database Mode (Optional Free Tier)**: For multi-device, multi-user WebSocket live presence sync, simply paste your free Google Firebase Realtime Database configuration into `visitor-counter-config.js`.

