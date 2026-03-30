import json
import time
from kafka import KafkaProducer

producer = KafkaProducer(
    bootstrap_servers="localhost:9092",
    value_serializer = lambda v: json.dumps(v).encode("utf-8")
)

sample_notfications = [
    {
        "eventId": "evt_1001",
        "userId": "user123",
        "type": "order_update",
        "title": "Order Shipped",
        "message": "Your order has been shipped."
    },
    {
        "eventId": "evt_1002",
        "userId": "user123",
        "type": "promo",
        "title": "Special Offer",
        "message": "You got 20% discount today."
    },
    {
        "eventId": "evt_1003",
        "userId": "user456",
        "type": "security",
        "title": "Login Alert",
        "message": "New Login detected."
    },
    {
        "eventId": "evt_1001",
        "userId": "user123",
        "type": "order_update",
        "title": "Order Shipped Duplicate",
        "message": "This should be skippped due to duplicate eventId + userId."
    },
    {
        "eventId": "evt_2001",
        "userId": "user123",
        "type": "order_update",
        "title": "Order Shipped Duplicate",
        "message": "This should be skippped due to duplicate eventId + userId."
    },
    {
        "eventId": "evt_2002",
        "userId": "user123",
        "type": "order_update",
        "title": "Order Shipped Duplicate",
        "message": "This should be skippped due to duplicate eventId + userId."
    },
    {
        "eventId": "evt_2003",
        "userId": "user123",
        "type": "order_update",
        "title": "Order Shipped Duplicate",
        "message": "This should be skippped due to duplicate eventId + userId."
    }
]

for notification in sample_notfications:
    producer.send("notifications", notification)
    print("Sent:", notification)
    time.sleep(2)

producer.flush()