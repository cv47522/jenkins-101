from python_project.app import greet


def test_greet():
    assert greet() == 'Hello, Jenkins!'
