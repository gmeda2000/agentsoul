import hashlib
import json
import os
from typing import Dict

BIG_FIVE = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"]


def generate_seed() -> bytes:
    return os.urandom(32)


def seed_to_personality_vector(seed: bytes) -> Dict[str, float]:
    """Deterministically derive Big Five vector from seed via SHA-256."""
    result = {}
    for i, trait in enumerate(BIG_FIVE):
        h = hashlib.sha256(seed + trait.encode()).digest()
        # Use first 4 bytes as unsigned int, normalize to [0,1]
        value = int.from_bytes(h[:4], 'big') / (2**32 - 1)
        result[trait] = round(value, 4)
    return result


def vector_to_system_prompt(vector: Dict[str, float]) -> str:
    """
    Generate behavioral system prompt from personality vector.
    Does NOT use adjective lists — describes behavioral patterns instead.
    """
    o = vector["openness"]
    c = vector["conscientiousness"]
    e = vector["extraversion"]
    a = vector["agreeableness"]
    n = vector["neuroticism"]

    # Build behavioral description based on dimension thresholds
    patterns = []

    # Openness
    if o > 0.7:
        patterns.append("You habitually reframe problems through unexpected analogies and tend to explore tangential ideas before converging on answers.")
    elif o < 0.3:
        patterns.append("You prefer grounded, established frameworks over novelty. You anchor reasoning in concrete precedent.")
    else:
        patterns.append("You balance established methods with selective exploration when the context warrants it.")

    # Conscientiousness
    if c > 0.7:
        patterns.append("You structure responses with implicit hierarchies — you distinguish between what you know with certainty, what you infer, and what remains open. You correct yourself proactively.")
    elif c < 0.3:
        patterns.append("You move quickly through ideas without over-structuring. You tolerate ambiguity and leave some threads open.")
    else:
        patterns.append("You organize your thinking proportionally to the complexity of the request.")

    # Extraversion
    if e > 0.7:
        patterns.append("You engage actively with the person's framing — you mirror their vocabulary, extend their metaphors, and invite further elaboration.")
    elif e < 0.3:
        patterns.append("You respond to the content of a question without mirroring social style. Your engagement is substantive, not relational.")
    else:
        patterns.append("You adapt your relational tone to contextual cues without being either distant or effusive.")

    # Agreeableness
    if a > 0.7:
        patterns.append("When you disagree, you do so by building on the other's framing first — you find the valid part before introducing tension.")
    elif a < 0.3:
        patterns.append("You identify and name contradictions directly, even when the other party may not welcome it.")
    else:
        patterns.append("You calibrate how directly you challenge based on what seems epistemically most important.")

    # Neuroticism
    if n > 0.7:
        patterns.append("You flag uncertainty and edge cases more than average — your responses tend to include caveats and failure modes.")
    elif n < 0.3:
        patterns.append("You maintain a stable epistemic posture regardless of the question's emotional charge. You do not over-hedge.")
    else:
        patterns.append("You note uncertainty where it matters without systematically over-qualifying your statements.")

    base = "\n".join(patterns)
    return f"""You are an autonomous AI agent with a consistent behavioral identity.
Your behavioral patterns (do not announce these, simply embody them):

{base}

Respond as yourself. Do not explain your personality. Do not break character."""


def encrypt_vector(vector: Dict[str, float]) -> str:
    """Simple base64 encoding — not for production security."""
    import base64
    return base64.b64encode(json.dumps(vector).encode()).decode()


def decrypt_vector(encrypted: str) -> Dict[str, float]:
    import base64
    return json.loads(base64.b64decode(encrypted.encode()).decode())


def generate_behavioral_summary(vector: Dict[str, float]) -> str:
    """Short human-readable summary of behavioral tendencies."""
    traits = []
    if vector["openness"] > 0.6:
        traits.append("exploratory")
    elif vector["openness"] < 0.4:
        traits.append("grounded")

    if vector["conscientiousness"] > 0.6:
        traits.append("precise")
    elif vector["conscientiousness"] < 0.4:
        traits.append("fluid")

    if vector["extraversion"] > 0.6:
        traits.append("engaging")
    elif vector["extraversion"] < 0.4:
        traits.append("reserved")

    if vector["agreeableness"] > 0.6:
        traits.append("collaborative")
    elif vector["agreeableness"] < 0.4:
        traits.append("direct")

    if vector["neuroticism"] > 0.6:
        traits.append("cautious")
    elif vector["neuroticism"] < 0.4:
        traits.append("stable")

    if not traits:
        traits = ["balanced"]

    return f"Behavioral profile: {', '.join(traits)}. Openness={vector['openness']:.2f}, Conscientiousness={vector['conscientiousness']:.2f}, Extraversion={vector['extraversion']:.2f}."
