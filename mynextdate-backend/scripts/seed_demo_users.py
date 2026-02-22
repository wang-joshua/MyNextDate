"""Seed demo users with date history and locations into Supabase for social discovery."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from supabase import create_client
from config import SUPABASE_URL, SUPABASE_SERVICE_KEY

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

DEMO_USERS = [
    {
        "email": "foodie.couple@mynextdate.app",
        "password": "DemoPass123!",
        "display_name": "The Foodie Couple",
        "city": "Atlanta",
        "dates": [
            {"activity_id": 85, "activity_name": "Fine Dining Experience", "rating": 5},
            {"activity_id": 19, "activity_name": "DIY Pizza Night", "rating": 4.5},
            {"activity_id": 178, "activity_name": "Thai Cooking Class", "rating": 5},
            {"activity_id": 145, "activity_name": "Street Food Crawl", "rating": 4},
            {"activity_id": 104, "activity_name": "Tapas Bar Tour", "rating": 4.5},
            {"activity_id": 172, "activity_name": "Private Chef Experience", "rating": 5},
            {"activity_id": 190, "activity_name": "Farmers Market Cooking", "rating": 4},
        ],
    },
    {
        "email": "adventure.seekers@mynextdate.app",
        "password": "DemoPass123!",
        "display_name": "Adventure Seekers",
        "city": "Denver",
        "dates": [
            {"activity_id": 76, "activity_name": "Zip Lining Adventure", "rating": 5},
            {"activity_id": 89, "activity_name": "Snowshoeing Adventure", "rating": 4.5},
            {"activity_id": 83, "activity_name": "Scuba Diving Experience", "rating": 5},
            {"activity_id": 195, "activity_name": "Sunrise Hot Air Balloon", "rating": 5},
            {"activity_id": 118, "activity_name": "Horseback Trail Ride", "rating": 4},
            {"activity_id": 98, "activity_name": "Paddleboarding", "rating": 4.5},
            {"activity_id": 63, "activity_name": "Bike Ride Along River", "rating": 4},
        ],
    },
    {
        "email": "night.owls@mynextdate.app",
        "password": "DemoPass123!",
        "display_name": "The Night Owls",
        "city": "New York",
        "dates": [
            {"activity_id": 1, "activity_name": "Underground Jazz Lounge Night", "rating": 5},
            {"activity_id": 38, "activity_name": "Karaoke Night", "rating": 4.5},
            {"activity_id": 67, "activity_name": "Cocktail Making Class", "rating": 4},
            {"activity_id": 159, "activity_name": "Craft Beer Tasting", "rating": 4.5},
            {"activity_id": 33, "activity_name": "Live Theater Performance", "rating": 5},
            {"activity_id": 23, "activity_name": "Stand-Up Comedy Show", "rating": 4},
            {"activity_id": 147, "activity_name": "Murder Mystery Dinner", "rating": 5},
        ],
    },
    {
        "email": "cozy.homebodies@mynextdate.app",
        "password": "DemoPass123!",
        "display_name": "Cozy Homebodies",
        "city": "Portland",
        "dates": [
            {"activity_id": 45, "activity_name": "Home Movie Marathon", "rating": 5},
            {"activity_id": 78, "activity_name": "Puzzle Room at Home", "rating": 4.5},
            {"activity_id": 57, "activity_name": "Couples Massage at Home", "rating": 5},
            {"activity_id": 171, "activity_name": "Build a Fort", "rating": 4},
            {"activity_id": 5, "activity_name": "Board Game Cafe Challenge", "rating": 4.5},
            {"activity_id": 148, "activity_name": "Hot Chocolate & Bookshop", "rating": 5},
            {"activity_id": 96, "activity_name": "Wine and Paint Night", "rating": 4},
        ],
    },
    {
        "email": "culture.buffs@mynextdate.app",
        "password": "DemoPass123!",
        "display_name": "The Culture Buffs",
        "city": "Chicago",
        "dates": [
            {"activity_id": 107, "activity_name": "Museum Scavenger Hunt", "rating": 5},
            {"activity_id": 41, "activity_name": "Amateur Painting Night", "rating": 4.5},
            {"activity_id": 33, "activity_name": "Live Theater Performance", "rating": 5},
            {"activity_id": 3, "activity_name": "Street Art Exploration Walk", "rating": 4},
            {"activity_id": 72, "activity_name": "Antique Shop Exploration", "rating": 4.5},
            {"activity_id": 66, "activity_name": "Flea Market Treasure Hunt", "rating": 4},
            {"activity_id": 136, "activity_name": "Charity Gala", "rating": 5},
        ],
    },
    {
        "email": "romantic.souls@mynextdate.app",
        "password": "DemoPass123!",
        "display_name": "Romantic Souls",
        "city": "San Francisco",
        "dates": [
            {"activity_id": 0, "activity_name": "Sunset Cliffside Picnic", "rating": 5},
            {"activity_id": 8, "activity_name": "Stargazing Night", "rating": 5},
            {"activity_id": 10, "activity_name": "Beach Bonfire Evening", "rating": 4.5},
            {"activity_id": 152, "activity_name": "Scenic Gondola Ride", "rating": 5},
            {"activity_id": 29, "activity_name": "Drive-In Movie Night", "rating": 4},
            {"activity_id": 156, "activity_name": "Rooftop Picnic", "rating": 4.5},
            {"activity_id": 189, "activity_name": "Scenic Cable Car Ride", "rating": 4},
        ],
    },
]


def seed():
    for user_data in DEMO_USERS:
        email = user_data["email"]
        print(f"\n--- Seeding {user_data['display_name']} ({email}) ---")

        # Create user via admin API
        try:
            user_resp = sb.auth.admin.create_user({
                "email": email,
                "password": user_data["password"],
                "email_confirm": True,
                "user_metadata": {"display_name": user_data["display_name"]},
            })
            user_id = user_resp.user.id
            print(f"  Created user: {user_id}")
        except Exception as e:
            err_str = str(e)
            if "already been registered" in err_str or "already exists" in err_str:
                # User exists — look up their ID
                users = sb.auth.admin.list_users()
                user_id = None
                for u in users:
                    if u.email == email:
                        user_id = u.id
                        break
                if not user_id:
                    print(f"  SKIP: Could not find existing user {email}")
                    continue
                print(f"  Already exists: {user_id}")
            else:
                print(f"  ERROR creating user: {e}")
                continue

        # Add date history
        for d in user_data["dates"]:
            try:
                sb.table("date_history").insert({
                    "user_id": user_id,
                    "activity_id": d["activity_id"],
                    "activity_name": d["activity_name"],
                    "rating": d["rating"],
                }).execute()
                print(f"  + {d['activity_name']} ({d['rating']}*)")
            except Exception as e:
                print(f"  SKIP date {d['activity_name']}: {e}")

        # Add location
        try:
            sb.table("user_locations").upsert({
                "user_id": user_id,
                "city": user_data["city"],
                "region": user_data["city"],
                "country": "United States",
            }, on_conflict="user_id").execute()
            print(f"  Location: {user_data['city']}")
        except Exception as e:
            print(f"  SKIP location: {e}")

    print("\n=== Done seeding demo users ===")


if __name__ == "__main__":
    seed()
