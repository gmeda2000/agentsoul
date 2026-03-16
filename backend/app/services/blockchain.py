import hashlib
import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)


async def register_birth_on_chain(agent_id: str, seed: bytes, timestamp: str) -> Optional[str]:
    """
    Register agent birth on Ethereum Sepolia testnet.
    Stores hash(seed + timestamp + agent_id) as calldata in a transaction.
    Returns tx hash or None if blockchain is unavailable.
    """
    try:
        from web3 import AsyncWeb3
        from eth_account import Account

        if not settings.SEPOLIA_PRIVATE_KEY or not settings.SEPOLIA_RPC_URL:
            logger.warning("Blockchain not configured — skipping registration")
            return None

        w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(settings.SEPOLIA_RPC_URL))

        if not await w3.is_connected():
            logger.warning("Cannot connect to Sepolia RPC")
            return None

        account = Account.from_key(settings.SEPOLIA_PRIVATE_KEY)

        # Compute birth hash
        birth_data = seed + timestamp.encode() + agent_id.encode()
        birth_hash = hashlib.sha256(birth_data).hexdigest()

        nonce = await w3.eth.get_transaction_count(account.address)
        gas_price = await w3.eth.gas_price

        tx = {
            'from': account.address,
            'to': account.address,  # self-send, no contract needed
            'value': 0,
            'gas': 21000 + len(birth_hash.encode()) * 68,
            'gasPrice': gas_price,
            'nonce': nonce,
            'chainId': 11155111,  # Sepolia
            'data': ('0x' + birth_hash.encode().hex())
        }

        signed = Account.sign_transaction(tx, settings.SEPOLIA_PRIVATE_KEY)
        tx_hash = await w3.eth.send_raw_transaction(signed.raw_transaction)
        tx_hex = tx_hash.hex()
        logger.info(f"Agent {agent_id} birth registered: {tx_hex}")
        return tx_hex

    except Exception as e:
        logger.error(f"Blockchain registration failed: {e}")
        return None


async def register_death_on_chain(agent_id: str, tx_hash_birth: Optional[str]) -> Optional[str]:
    """Register agent death on Sepolia testnet."""
    try:
        from web3 import AsyncWeb3
        from eth_account import Account

        if not settings.SEPOLIA_PRIVATE_KEY:
            return None

        w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(settings.SEPOLIA_RPC_URL))
        account = Account.from_key(settings.SEPOLIA_PRIVATE_KEY)

        death_marker = f"DEATH:{agent_id}:BIRTH:{tx_hash_birth or 'unknown'}"
        nonce = await w3.eth.get_transaction_count(account.address)
        gas_price = await w3.eth.gas_price

        tx = {
            'from': account.address,
            'to': account.address,
            'value': 0,
            'gas': 50000,
            'gasPrice': gas_price,
            'nonce': nonce,
            'chainId': 11155111,
            'data': ('0x' + death_marker.encode().hex())
        }

        signed = Account.sign_transaction(tx, settings.SEPOLIA_PRIVATE_KEY)
        tx_hash = await w3.eth.send_raw_transaction(signed.raw_transaction)
        return tx_hash.hex()

    except Exception as e:
        logger.error(f"Death blockchain registration failed: {e}")
        return None
