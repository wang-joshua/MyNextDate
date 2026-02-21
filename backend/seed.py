"""Seed the Actian Vector AI DB with date activities."""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from services.actian_service import get_client, init_collection, seed_activities
from config import ACTIAN_HOST


def main():
    print(f"Connecting to Actian at {ACTIAN_HOST}...")
    client = get_client()

    try:
        version, uptime = client.health_check()
        print(f"Connected! Version: {version}, Uptime: {uptime}s")

        print("Creating collection...")
        init_collection(client)

        print("Seeding activities...")
        activities_path = os.path.join(
            os.path.dirname(__file__), "data", "activities.json"
        )
        seed_activities(client, activities_path)

        print("Done! Verifying...")
        stats = client.describe_collection("date_activities")
        print(f"Collection stats: {stats}")
    finally:
        client.close()


if __name__ == "__main__":
    main()
