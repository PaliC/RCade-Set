import pygame

# Colors
WHITE = (255, 255, 255)

# Visual mappings for drawing (category values -> visual representation)
COLOR_MAP = {
    "red": (220, 60, 60),
    "green": (60, 180, 60),
    "blue": (60, 100, 220),
}


class Card:
    def __init__(self, category1, category2, category3, category4):
        self.category1 = category1  # shape
        self.category2 = category2  # color
        self.category3 = category3  # count
        self.category4 = category4  # fill

    def __eq__(self, other):
        return (self.category1 == other.category1 and self.category2 == other.category2 and
                self.category3 == other.category3 and self.category4 == other.category4)

    def check_if_set(self, other1, other2):
        def check_attribute(attr, other1_attr, other2_attr):
            all_same = (attr == other1_attr == other2_attr)
            all_diff = (attr != other1_attr and attr != other2_attr and other1_attr != other2_attr)
            return all_same or all_diff

        attrs = [self.category1, self.category2, self.category3, self.category4]
        other1_attrs = [other1.category1, other1.category2, other1.category3, other1.category4]
        other2_attrs = [other2.category1, other2.category2, other2.category3, other2.category4]
        return all(check_attribute(a, b, c) for a, b, c in zip(attrs, other1_attrs, other2_attrs))

    def draw(self, screen, x, y, width, height):
        """Draw this card's shapes at the given position."""
        color = COLOR_MAP.get(self.category2, WHITE)
        count = int(self.category3)
        shape = self.category1
        fill = self.category4

        shape_width = 20
        shape_height = 30
        spacing = 24
        total_width = count * shape_width + (count - 1) * (spacing - shape_width)
        start_x = x + (width - total_width) // 2
        center_y = y + height // 2

        for i in range(count):
            sx = start_x + i * spacing
            sy = center_y - shape_height // 2
            self._draw_shape(screen, shape, fill, sx, sy, shape_width, shape_height, color)

    def _draw_shape(self, screen, shape, fill, x, y, w, h, color):
        """Draw a single shape with the given fill style."""
        if shape == "circle":
            rect = pygame.Rect(x, y, w, h)
            self._draw_filled(screen, "ellipse", rect, fill, color)
        elif shape == "square":
            rect = pygame.Rect(x + 2, y + 4, w - 4, h - 8)
            self._draw_filled(screen, "rect", rect, fill, color)
        elif shape == "triangle":
            points = [(x + w // 2, y), (x + w, y + h), (x, y + h)]
            self._draw_filled(screen, "polygon", points, fill, color)

    def _draw_filled(self, screen, shape_type, shape_data, fill, color):
        """Draw shape with the specified fill style."""
        if fill == "solid":
            if shape_type == "polygon":
                pygame.draw.polygon(screen, color, shape_data)
            elif shape_type == "ellipse":
                pygame.draw.ellipse(screen, color, shape_data)
            elif shape_type == "rect":
                pygame.draw.rect(screen, color, shape_data)
        elif fill == "open":
            if shape_type == "polygon":
                pygame.draw.polygon(screen, color, shape_data, 2)
            elif shape_type == "ellipse":
                pygame.draw.ellipse(screen, color, shape_data, 2)
            elif shape_type == "rect":
                pygame.draw.rect(screen, color, shape_data, 2)
        elif fill == "striped":
            # Draw outline + horizontal stripes
            if shape_type == "polygon":
                pygame.draw.polygon(screen, color, shape_data, 2)
                min_y = min(p[1] for p in shape_data)
                max_y = max(p[1] for p in shape_data)
                min_x = min(p[0] for p in shape_data)
                max_x = max(p[0] for p in shape_data)
            elif shape_type == "ellipse":
                pygame.draw.ellipse(screen, color, shape_data, 2)
                min_y, max_y = shape_data.top, shape_data.bottom
                min_x, max_x = shape_data.left, shape_data.right
            elif shape_type == "rect":
                pygame.draw.rect(screen, color, shape_data, 2)
                min_y, max_y = shape_data.top, shape_data.bottom
                min_x, max_x = shape_data.left, shape_data.right
            for stripe_y in range(int(min_y) + 4, int(max_y), 6):
                pygame.draw.line(screen, color, (min_x + 2, stripe_y), (max_x - 2, stripe_y), 1)
