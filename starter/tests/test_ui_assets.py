from pathlib import Path


def test_index_template_includes_dark_mode_and_mobile_meta():
    here = Path(__file__).resolve().parent
    index_path = here.parent / "templates" / "index.html"
    html = index_path.read_text(encoding="utf-8")

    assert 'id="theme-toggle"' in html
    assert 'id="use-hint"' in html
    assert 'id="hint-count"' in html
    assert 'id="difficulty-select"' in html
    assert '<meta name="viewport"' in html


def test_stylesheet_contains_responsive_rules_and_hidden_leaderboard_override():
    here = Path(__file__).resolve().parent
    css_path = here.parent / "static" / "styles.css"
    css = css_path.read_text(encoding="utf-8")

    assert '@media (max-width: 768px)' in css
    assert '.leaderboard-hidden' in css
    assert 'display: none !important' in css
