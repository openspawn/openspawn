#!/usr/bin/env python3
"""Run the BikiniBottom sandbox server."""
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("SANDBOX_PORT", "3333"))
    uvicorn.run(
        "app.server:app",
        host="0.0.0.0",
        port=port,
        reload=os.environ.get("DEV", "0") == "1",
        log_level="info",
    )
