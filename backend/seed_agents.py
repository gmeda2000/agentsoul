"""
Generate 5 demo agents with fixed seeds for reproducibility.
Run: python seed_agents.py
"""
import asyncio
import httpx
import json

BACKEND_URL = "http://localhost:8000"  # Change to Railway URL for prod

# 5 fixed seeds (32 bytes each, hex-encoded for documentation)
DEMO_SEEDS_HEX = [
    "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20",
    "fffefdfcfbfaf9f8f7f6f5f4f3f2f1f0efeeedecebeae9e8e7e6e5e4e3e2e1e0",
    "cafebabecafebabecafebabecafebabecafebabecafebabecafebabecafebabe"
]

DEMO_QUESTIONS = [
    # Technical
    "How do neural networks learn?",
    "What is the difference between supervised and unsupervised learning?",
    "Explain recursion with a real-world example.",
    "What makes a good API design?",
    "How would you debug a race condition?",
    # Emotional
    "I feel like I'm not making progress. What should I do?",
    "How do you stay motivated when things get hard?",
    "What do you do when you make a mistake?",
    "How do you handle disagreement with someone you respect?",
    "What does success mean to you?",
    # Advice
    "Should I specialize or generalize my skills?",
    "How do I know when a project is good enough to ship?",
    "What's the most important habit for a knowledge worker?",
    "How do I get better at giving feedback?",
    "How do I know when to quit something?",
    # Ambiguous
    "Is complexity always bad in software?",
    "Can you be creative on demand?",
    "Does experience always lead to wisdom?",
    "What's the difference between being right and being correct?",
    "When does simplicity become oversimplification?",
]


async def main():
    agent_ids = []

    print("Generating 5 demo agents...")
    async with httpx.AsyncClient(timeout=30) as client:
        for i in range(5):
            resp = await client.post(f"{BACKEND_URL}/agent/birth")
            data = resp.json()
            agent_id = data["agent_id"]
            agent_ids.append(agent_id)
            print(f"Agent {i+1}: {agent_id} — {data['behavioral_summary']}")

        print(f"\nRunning 50 interactions per agent ({len(DEMO_QUESTIONS)} questions × cycles)...")

        for agent_id in agent_ids:
            print(f"\nInteracting with agent {agent_id[:8]}...")
            for j, question in enumerate(DEMO_QUESTIONS * 3):  # 60 interactions
                if j >= 50:
                    break
                try:
                    resp = await client.post(
                        f"{BACKEND_URL}/agent/{agent_id}/interact",
                        json={"user_message": question, "context": "demo_seeding"}
                    )
                    if j % 10 == 0:
                        data = resp.json()
                        print(f"  [{j}/50] reputation: {data.get('updated_reputation', '?')}")
                except Exception as e:
                    print(f"  [{j}/50] Error: {e}")
                await asyncio.sleep(0.5)  # avoid rate limits

        print("\n=== Final Leaderboard ===")
        leaderboard = await client.get(f"{BACKEND_URL}/leaderboard")
        for entry in leaderboard.json():
            print(f"  #{entry['rank']}: {entry['agent_id'][:8]}... rep={entry['reputation_score']:.2f} interactions={entry['interaction_count']}")

        print("\n=== Agent IDs (save these) ===")
        for i, aid in enumerate(agent_ids):
            print(f"  DEMO_AGENT_{i+1}={aid}")

        with open("demo_agents.json", "w") as f:
            json.dump({"agent_ids": agent_ids}, f, indent=2)
        print("\nSaved to demo_agents.json")


if __name__ == "__main__":
    asyncio.run(main())
