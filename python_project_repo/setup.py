from setuptools import setup, find_packages
from pathlib import Path
from typing import List

THISDIR = Path(__file__).parent
VERSION_FILE = str(THISDIR / 'python_project/version.py')
README_FILE = (THISDIR / 'README.rst')
REQUIREMENTS_MINIMAL_FILE = str(THISDIR / 'requirements-minimal.txt')

def get_minimal_requirements() -> List[str]:
    with open(REQUIREMENTS_MINIMAL_FILE, 'r') as f:
        return [line.strip() for line in f]


def get_long_description() -> str:
    with open(README_FILE, 'r') as readme:
        return readme.read()


def get_version() -> str:
    with open(VERSION_FILE, 'r') as ver:
        return ver.read().split('=')[1].strip().strip("'")

__version__ = get_version()

setup(
    name='python_project',
    version=__version__,
    long_description=get_long_description(),
    author='Wan-Ting Hsieh',
    # A list of all Python packages to include in the distribution, automatically found using find_packages().
    packages=find_packages(),
    # Lists the package's dependencies.
    install_requires=get_minimal_requirements(),
    # Defines entry points for command-line scripts. Here, a console script called python-project is created,
    # which points to the main function in the app module.
    entry_points={
        'console_scripts': ['python-project=app:main']
    },
    # Indicates whether the package can be safely run from a zipped archive. Here, False means it should be unpacked.
    zip_safe=False,
    license='BSD-3-Clause',
    url='https://github.com/cv47522/jenkins-101',
    # Provide metadata about the package (e.g., intended audience, programming language, and topic).
    classifiers=['Intended Audience :: Developers',
                'License :: OSI Approved :: BSD License',
                'Programming Language :: Python :: 3.9',
                'Topic :: Software Development']
)