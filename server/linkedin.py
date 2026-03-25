"""
LinkedIn Voyager API scraper — gets post likers and commenters
using LinkedIn's internal API with session cookies.

Based on https://github.com/peak050423/linkedin-scraper
"""

import re
import json
import requests
from math import ceil
from concurrent.futures import ThreadPoolExecutor, as_completed

def _build_headers(cookies):
    csrf = cookies.get("JSESSIONID", "").strip('"')
    return {
        "accept": "application/vnd.linkedin.normalized+json+2.1",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.9",
        "csrf-token": csrf,
        "x-li-lang": "en_US",
        "x-restli-protocol-version": "2.0.0",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    }


def load_cookies(cookie_file="cookies.json"):
    with open(cookie_file, "r") as f:
        raw = json.load(f)
    # Support both [{name, value}] format and {name: value} format
    if isinstance(raw, list):
        return {c["name"]: c["value"] for c in raw}
    return raw


def _fetch(url, cookies):
    try:
        resp = requests.get(url, cookies=cookies, headers=_build_headers(cookies), timeout=30, allow_redirects=False)
    except requests.exceptions.TooManyRedirects:
        print("  _fetch: too many redirects — cookies likely expired")
        return None
    if resp.status_code == 200:
        return resp.json()
    if resp.status_code in (301, 302, 303):
        print(f"  _fetch: redirect to {resp.headers.get('Location', '?')} — cookies expired")
        return None
    print(f"  _fetch failed: {resp.status_code}")
    return None


def _get_post_id(post_url, cookies):
    """Extract the post ID from a LinkedIn post URL."""
    # Try to get activity ID directly from URL (most common format)
    match = re.search(r"activity[- ](\d+)", post_url)
    if match:
        return match.group(1)
    # Try ugcPost format in URL
    match = re.search(r"ugcPost[- ](\d+)", post_url)
    if match:
        return match.group(1)
    # Fallback: fetch page and look for IDs
    resp = requests.get(post_url, cookies=cookies, headers=_build_headers(cookies), timeout=30)
    if resp.status_code != 200:
        return None
    matches = re.findall(r"urn:li:ugcPost:(\d+)", resp.text)
    if not matches:
        matches = re.findall(r"urn:li:activity:(\d+)", resp.text)
    return matches[0] if matches else None


def _get_experience(actor_urns, cookies):
    """Fetch job titles for a batch of actor URNs."""
    results = {}
    cookies_ref = cookies

    def fetch_one(urn):
        import urllib.parse
        encoded = urllib.parse.quote(urn)
        url = f"https://www.linkedin.com/voyager/api/graphql?variables=(profileUrn:{encoded},sectionType:experience,locale:en_US)&queryId=voyagerIdentityDashProfileComponents.a62d9c6739ad5a19fdf61591073dec32"
        data = _fetch(url, cookies_ref)
        if not data:
            return url, None
        # Extract job title and company from experience data
        try:
            components = data.get("included", [])
            for comp in components:
                if comp.get("$type") == "com.linkedin.voyager.dash.identity.profile.tetris.Component":
                    sub = comp.get("components", {})
                    if sub and sub.get("fixedListComponent"):
                        items = sub["fixedListComponent"].get("components", [])
                        if items:
                            first = items[0].get("components", {})
                            entity = first.get("entityComponent", {})
                            title = entity.get("titleV2", {}).get("text", {}).get("text", "")
                            subtitle = entity.get("subtitle", {}).get("text", "")
                            return url, {"title": title, "company": subtitle}
        except Exception:
            pass
        return url, None

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(fetch_one, urn): urn for urn in actor_urns[:50]}
        for future in as_completed(futures):
            url, data = future.result()
            if data:
                results[futures[future]] = data

    return results


def scrape_post_likers(post_url, cookies):
    """
    Scrape all likers of a LinkedIn post.
    Returns list of {name, title, company, linkedin_url, comment_text, icp_match}.
    """
    post_id = _get_post_id(post_url, cookies)
    if not post_id:
        return {"error": "Could not find post ID. Check the URL and cookies."}

    # Try both activity and ugcPost URN formats
    data = None
    urn_type = None
    for ut in ["activity", "ugcPost"]:
        url = f"https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(count:10,start:0,threadUrn:urn%3Ali%3A{ut}%3A{post_id})&queryId=voyagerSocialDashReactions.cab051ffdf47c41130cdd414e0097402"
        resp = _fetch(url, cookies)
        if resp:
            try:
                reactions = resp["data"]["data"]["socialDashReactionsByReactionType"]
                if reactions and reactions.get("paging"):
                    data = resp
                    urn_type = ut
                    break
            except (KeyError, TypeError):
                continue

    if not data:
        return {"error": "Failed to fetch likers. Session may be expired or post not found."}

    try:
        total = data["data"]["data"]["socialDashReactionsByReactionType"]["paging"]["total"]
    except (KeyError, TypeError):
        return {"error": "Unexpected API response. LinkedIn may have changed their API."}

    # Fetch all likers in batches of 100
    leads = []
    actor_urns = []
    pages = ceil(total / 100)
    working_urn = urn_type  # Use the URN type that worked above

    for i in range(min(pages, 30)):  # Cap at 3000 likers
        url = f"https://www.linkedin.com/voyager/api/graphql?includeWebMetadata=true&variables=(count:100,start:{i * 100},threadUrn:urn%3Ali%3A{working_urn}%3A{post_id})&queryId=voyagerSocialDashReactions.cab051ffdf47c41130cdd414e0097402"
        batch = _fetch(url, cookies)
        if not batch:
            continue

        for elem in batch.get("included", []):
            if not elem or not elem.get("actorUrn"):
                continue

            actor_urns.append(elem["actorUrn"])
            lockup = elem.get("reactorLockup", {})
            if not lockup:
                continue

            name = lockup.get("title", {}).get("text", "")
            headline = ""
            if lockup.get("subtitle"):
                headline = lockup["subtitle"].get("text", "")
            profile_url = lockup.get("navigationUrl", "")

            # Extract company from headline (usually "Title @ Company" or "Title | Company")
            company = ""
            if headline:
                for sep in [" @ ", " @", " | ", " at "]:
                    if sep in headline:
                        parts = headline.split(sep, 1)
                        company = parts[1].strip().split("|")[0].strip()
                        break

            leads.append({
                "name": name,
                "title": headline,
                "company": company,
                "linkedin_url": profile_url,
                "comment_text": "",
                "scraped_from": post_url,
            })

    return {"leads": leads, "total": total, "fetched": len(leads)}


if __name__ == "__main__":
    import sys
    cookies = load_cookies()
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.linkedin.com/posts/rmeadows_most-gtm-playbooks-for-2026-are-already-outdated-activity-7414393874053521408"
    result = scrape_post_likers(url, cookies)
    print(json.dumps(result, indent=2))
