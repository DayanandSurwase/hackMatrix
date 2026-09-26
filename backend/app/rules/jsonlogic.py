from __future__ import annotations

from typing import Any


class JsonLogicError(ValueError):
    pass


def jsonlogic(rule: Any, data: dict[str, Any] | None = None) -> Any:
    """Minimal JsonLogic interpreter for eligibility predicates."""
    data = data or {}
    if rule is None or isinstance(rule, (bool, int, float, str)):
        return rule
    if isinstance(rule, list):
        return [jsonlogic(item, data) for item in rule]
    if not isinstance(rule, dict):
        return rule

    if not rule:
        return data
    op, raw = next(iter(rule.items()))
    args = raw if isinstance(raw, list) else [raw]

    if op == "var":
        path = args[0] if args else ""
        default = args[1] if len(args) > 1 else None
        return _resolve(path, data, default)
    if op == "missing":
        names = args if isinstance(raw, list) else args
        return [n for n in names if _resolve(n, data, None) in (None, "")]
    if op == "if":
        i = 0
        while i < len(args) - 1:
            if jsonlogic(args[i], data):
                return jsonlogic(args[i + 1], data)
            i += 2
        return jsonlogic(args[-1], data) if args else None
    if op == "and":
        value = True
        for arg in args:
            value = jsonlogic(arg, data)
            if not value:
                return value
        return value
    if op == "or":
        value = False
        for arg in args:
            value = jsonlogic(arg, data)
            if value:
                return value
        return value
    if op == "!":
        return not bool(jsonlogic(args[0], data) if args else False)
    if op == "!!":
        return bool(jsonlogic(args[0], data) if args else False)
    if op == "in":
        needle = jsonlogic(args[0], data)
        hay = jsonlogic(args[1], data) if len(args) > 1 else []
        try:
            return needle in hay
        except TypeError:
            return False
    if op in {"==", "===", "!=", "!==", ">", ">=", "<", "<="}:
        left = jsonlogic(args[0], data)
        right = jsonlogic(args[1], data) if len(args) > 1 else None
        return _compare(op, left, right)
    if op == "+":
        total = 0
        for arg in args:
            total += float(jsonlogic(arg, data) or 0)
        return total
    raise JsonLogicError(f"Unsupported JsonLogic operator: {op}")


def _resolve(path: str, data: dict[str, Any], default: Any) -> Any:
    if path in ("", None):
        return data
    current: Any = data
    for part in str(path).split("."):
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return default
    return current


def _compare(op: str, left: Any, right: Any) -> bool:
    if op in {"==", "==="}:
        return left == right
    if op in {"!=", "!=="}:
        return left != right
    try:
        left_n = float(left)
        right_n = float(right)
    except (TypeError, ValueError):
        return False
    if op == ">":
        return left_n > right_n
    if op == ">=":
        return left_n >= right_n
    if op == "<":
        return left_n < right_n
    if op == "<=":
        return left_n <= right_n
    return False
