import pytest
import sys
import os

# Add fixture root to sys.path so tests run reliably
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fast_slugify import slugify


def test_basic_slug():
    assert slugify("Hello World") == "hello-world"


def test_unicode():
    assert slugify("Café au Lait") == "cafe-au-lait"


def test_consecutive_hyphens():
    # Buggy version produces 'hello---world'
    assert slugify("Hello --- World") == "hello-world"


def test_trailing_hyphens():
    # Buggy version leaves trailing hyphens
    assert slugify("trailing hyphen -") == "trailing-hyphen"
