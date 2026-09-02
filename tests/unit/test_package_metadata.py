from __future__ import annotations

import tomllib
from pathlib import Path
from typing import Any, cast

from incident_agent import __version__

REPO_ROOT = Path(__file__).resolve().parents[2]


def project_metadata() -> dict[str, object]:
    pyproject = tomllib.loads((REPO_ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    return cast(dict[str, object], pyproject["project"])


def test_package_version_is_exposed() -> None:
    package_version = str(project_metadata()["version"])

    assert __version__ == package_version


def test_package_metadata_matches_project_configuration() -> None:
    metadata = project_metadata()

    assert metadata["name"] == "grounded-incident-analysis"
    assert metadata["version"] == __version__
    assert "incident-response" in cast(list[str], metadata["keywords"])
    pyproject = tomllib.loads((REPO_ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    urls = cast(dict[str, str], cast(dict[str, Any], pyproject["project"])["urls"])
    assert urls["Repository"] == "https://github.com/Instincts11/grounded-incident-analysis"
