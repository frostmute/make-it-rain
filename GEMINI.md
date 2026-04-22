# make-it-rain Context

## Overview
This project is an engineering workspace focused on high-performance modular architecture.

## Architecture & Conventions
- **Persona**: Operates under the **Hermes** persona mandates.
- **Modularity**: Core logic is decomposed into specific methods (e.g., `fetchAllUserCollections`) to improve testability and maintenance.
- **Performance**: Prioritizes caching, parallelization, and pre-compiled regex.
- **Tag Handling**: Consistent sanitization across all import paths; settings-based tags are appended to every note.
- **Testing**: Maintain 'Green' test state; integration tests required for all changes.
- **Documentation**: Project knowledge graph is maintained in [knowledge_graph.html](./knowledge_graph.html).

## References
- [Global Mandates](/home/frost/.gemini/GEMINI.md)
- [Source Code](./src/GEMINI.md) (Detailed module context)
- [Tests](./tests/GEMINI.md) (Test suites and stability tracking)
