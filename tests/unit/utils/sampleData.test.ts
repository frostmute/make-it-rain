/**
 * Unit Tests for Sample Data
 * ==========================
 *
 * Tests for the static SAMPLE_RAINDROPS fixtures used by the settings
 * live template preview. Verifies that every Raindrop type is represented
 * and that each entry matches the expected schema.
 */

import { SAMPLE_RAINDROPS, SampleRaindrop } from "../../../src/utils/sampleData";
import { RaindropTypes } from "../../../src/types";

describe("SAMPLE_RAINDROPS", () => {
  const allTypes = Object.values(RaindropTypes);

  it("should provide a sample for every Raindrop type", () => {
    for (const type of allTypes) {
      expect(SAMPLE_RAINDROPS[type]).toBeDefined();
    }
    expect(Object.keys(SAMPLE_RAINDROPS).sort()).toEqual([...allTypes].sort());
  });

  it("should set each sample's type to match its key", () => {
    for (const type of allTypes) {
      expect(SAMPLE_RAINDROPS[type].type).toBe(type);
    }
  });

  describe.each(allTypes)("sample for type '%s'", (type) => {
    let sample: SampleRaindrop;

    beforeEach(() => {
      sample = SAMPLE_RAINDROPS[type];
    });

    it("should have all required fields with the correct types", () => {
      expect(typeof sample._id).toBe("number");
      expect(typeof sample.title).toBe("string");
      expect(typeof sample.excerpt).toBe("string");
      expect(typeof sample.note).toBe("string");
      expect(typeof sample.link).toBe("string");
      expect(typeof sample.cover).toBe("string");
      expect(typeof sample.created).toBe("string");
      expect(typeof sample.lastupdate).toBe("string");
      expect(Array.isArray(sample.tags)).toBe(true);
      expect(typeof sample.collectionId).toBe("number");
      expect(typeof sample.collectionTitle).toBe("string");
      expect(typeof sample.collectionPath).toBe("string");
      expect(Array.isArray(sample.highlights)).toBe(true);
    });

    it("should have a link that parses as a valid URL", () => {
      expect(() => new URL(sample.link)).not.toThrow();
    });

    it("should have parseable created and lastupdate dates", () => {
      expect(Number.isNaN(new Date(sample.created).getTime())).toBe(false);
      expect(Number.isNaN(new Date(sample.lastupdate).getTime())).toBe(false);
    });

    it("should have string tags only", () => {
      for (const tag of sample.tags) {
        expect(typeof tag).toBe("string");
      }
    });

    it("should have well-formed highlights", () => {
      for (const highlight of sample.highlights) {
        expect(typeof highlight.text).toBe("string");
        if (highlight.note !== undefined) {
          expect(typeof highlight.note).toBe("string");
        }
      }
    });
  });
});
