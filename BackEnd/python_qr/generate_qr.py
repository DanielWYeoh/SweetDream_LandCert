import sys
import uuid
from pathlib import Path

import qrcode
from qrcode.constants import ERROR_CORRECT_M

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "generated"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def main() -> int:
    if len(sys.argv) != 2 or not sys.argv[1].strip():
        print("Usage: python generate_qr.py <verification-url>", file=sys.stderr)
        return 2

    payload = sys.argv[1].strip()
    if not payload.startswith(("http://", "https://")):
        print("QR payload must be an HTTP(S) verification URL.", file=sys.stderr)
        return 2

    qr = qrcode.QRCode(
        version=None,
        error_correction=ERROR_CORRECT_M,
        box_size=12,
        border=5,
    )
    qr.add_data(payload)
    qr.make(fit=True)

    image = qr.make_image(
        fill_color="#0B4A3B",
        back_color="#FFFDF6",
    ).convert("RGB")

    output_path = OUTPUT_DIR / f"lancert-qr-{uuid.uuid4().hex}.png"
    image.save(output_path, format="PNG", optimize=True)
    print(str(output_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
