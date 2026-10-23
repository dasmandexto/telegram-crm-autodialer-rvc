import re
import random

class SpintaxService:
    """
    Recursive Spintax processor supporting nested syntax like:
    {Привет|{Добрый день|Здравствуйте}}, {дорогой|уважаемый} партнер!
    """

    @staticmethod
    def spin(text: str) -> str:
        if not text:
            return ""

        result = text
        pattern = re.compile(r"\{([^{}]+)\}")

        # Iteratively resolve innermost curly braces until none remain
        max_iterations = 50
        iterations = 0

        while pattern.search(result) and iterations < max_iterations:
            def replace_match(match: re.Match) -> str:
                options = [opt.strip() for opt in match.group(1).split("|")]
                return random.choice(options) if options else ""

            result = pattern.sub(replace_match, result)
            iterations += 1

        return result

    @staticmethod
    def count_combinations(text: str) -> int:
        if not text:
            return 1

        working_text = text
        pattern = re.compile(r"\{([^{}]+)\}")
        max_iterations = 50
        iterations = 0

        while pattern.search(working_text) and iterations < max_iterations:
            def replace_with_count(match: re.Match) -> str:
                parts = match.group(1).split("|")
                total = 0
                for part in parts:
                    sub_match = re.match(r"^__SPIN_COUNT_(\d+)__$", part.strip())
                    if sub_match:
                        total += int(sub_match.group(1))
                    else:
                        total += 1
                return f"__SPIN_COUNT_{max(1, total)}__"

            working_text = pattern.sub(replace_with_count, working_text)
            iterations += 1

        count_tags = re.findall(r"__SPIN_COUNT_(\d+)__", working_text)
        if not count_tags:
            return 1

        total = 1
        for cnt in count_tags:
            total *= int(cnt)
            if total > 1_000_000_000:
                return 1_000_000_000

        return total
