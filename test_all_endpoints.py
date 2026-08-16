import asyncio
from typing import Any
from urllib.parse import quote
import httpx

BASE_URL = "http://localhost:3000"
SAMPLE_BANNER = "EN A Shared Oath of Guardianship"
SAMPLE_OPERATOR = "char_103_angel"

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
RESET = "\033[0m"


def print_result(
    method: str, path: str, status: int, expected: int, body: Any
) -> None:
    tag = f"{GREEN}[PASS]{RESET}" if status == expected else f"{RED}[FAIL]{RESET}"
    status_str = (
        f"{GREEN}{status}{RESET}"
        if status == expected
        else f"{RED}{status}{RESET}"
    )

    print(f"{tag} {CYAN}{method:5}{RESET} {path:55} Status: {status_str}")

    if status != expected or status == 500:
        cleaned_body = str(body).replace("\n", " ").strip()
        if len(cleaned_body) > 120:
            cleaned_body = cleaned_body[:117] + "..."
        print(f"       {YELLOW}↳ Details:{RESET} {cleaned_body}")


async def run_tests() -> None:
    async with httpx.AsyncClient(
        base_url=BASE_URL, timeout=10.0, follow_redirects=True
    ) as client:
        print(
            f"\n=== {CYAN}1. Banner & Operator Endpoints{RESET} ================="
        )

        res = await client.get("/api/banners/1")
        print_result("GET", "/api/banners/1", res.status_code, 200, res.text)

        res = await client.get("/api/banners/0")
        print_result(
            "GET",
            "/api/banners/0 (Invalid)",
            res.status_code,
            404,
            res.json() if res.status_code == 404 else res.text,
        )

        encoded_banner = quote(SAMPLE_BANNER)
        res = await client.get(f"/api/banner/{encoded_banner}")
        print_result(
            "GET",
            f"/api/banner/{SAMPLE_BANNER}",
            res.status_code,
            200,
            res.text,
        )

        res = await client.get(f"/api/operator/{SAMPLE_OPERATOR}")
        print_result(
            "GET",
            f"/api/operator/{SAMPLE_OPERATOR}",
            res.status_code,
            200,
            res.text,
        )

        res = await client.get("/api/banners/all")
        print_result("GET", "/api/banners/all", res.status_code, 200, res.text)

        print(
            f"\n=== {CYAN}2. Asset Endpoints{RESET} ==============================="
        )

        res = await client.get(f"/assets/banner/{encoded_banner}")
        print_result(
            "GET",
            f"/assets/banner/{SAMPLE_BANNER}",
            res.status_code,
            200,
            res.text,
        )

        res = await client.get(f"/assets/operator/{SAMPLE_OPERATOR}")
        print_result(
            "GET",
            f"/assets/operator/{SAMPLE_OPERATOR}",
            res.status_code,
            200,
            res.text,
        )

        res = await client.get(f"/assets/e2operator/{SAMPLE_OPERATOR}")
        print_result(
            "GET",
            f"/assets/e2operator/{SAMPLE_OPERATOR}",
            res.status_code,
            200,
            res.text,
        )

        res = await client.get(f"/assets/card/{SAMPLE_OPERATOR}")
        print_result(
            "GET",
            f"/assets/card/{SAMPLE_OPERATOR}",
            res.status_code,
            200,
            res.text,
        )

        print(
            f"\n=== {CYAN}3. Gacha Endpoints{RESET} ==============================="
        )

        res = await client.post("/gacha/create")
        token = res.headers.get("Session-Token") or res.headers.get(
            "session-token"
        )
        print_result(
            "POST",
            "/gacha/create",
            res.status_code,
            200,
            f"Token: {token}" if token else res.text,
        )

        if not token:
            print(f"       {RED}Aborting remaining tests due to missing token.{RESET}")
            return

        headers = {"Session-Token": token}

        res = await client.get("/gacha/profile", headers=headers)
        print_result("GET", "/gacha/profile", res.status_code, 200, res.text)

        res = await client.post(
            f"/gacha/{encoded_banner}/roll", headers=headers
        )
        print_result(
            "POST",
            f"/gacha/{SAMPLE_BANNER}/roll",
            res.status_code,
            200,
            res.text,
        )

        res = await client.post(
            f"/gacha/{encoded_banner}/roll/10", headers=headers
        )
        print_result(
            "POST",
            f"/gacha/{SAMPLE_BANNER}/roll/10",
            res.status_code,
            200,
            res.text,
        )

        res = await client.post(
            f"/gacha/{encoded_banner}/roll/10?reduced=true", headers=headers
        )
        print_result(
            "POST",
            f"/gacha/{SAMPLE_BANNER}/roll/10?reduced=true",
            res.status_code,
            200,
            res.text,
        )

        res = await client.request(
            "PURGE", "/gacha/delete/", headers=headers
        )
        print_result(
            "PURGE", "/gacha/delete/", res.status_code, 200, res.text
        )

        res = await client.get("/gacha/profile", headers=headers)
        print_result(
            "GET",
            "/gacha/profile (Post-Delete)",
            res.status_code,
            404,
            res.text,
        )


if __name__ == "__main__":
    asyncio.run(run_tests())
