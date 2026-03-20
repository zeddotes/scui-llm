import { describe, it, expect } from "vitest";
import {
  executeSCUIRequest,
  SCUIAdapter,
  SCUIModelRequest,
  SCUIModelResponse,
} from "./index";

describe("executeSCUIRequest", () => {
  it("normalizes adapter response into SCUIResponse", async () => {
    const adapter: SCUIAdapter = {
      async generate<T = unknown>(input: SCUIModelRequest): Promise<SCUIModelResponse<T>> {
        void input;
        return {
          data: {
            blocks: [
              {
                component: "MetricCard",
                props: { label: "Users", value: "10" },
              },
            ],
          } as unknown as T,
        };
      },
    };

    const result = await executeSCUIRequest(
      {
        prompt: "Show metrics",
        catalog: [],
      },
      { adapter },
    );

    expect(result.blocks).toHaveLength(1);
    const firstBlock = result.blocks[0]!;
    expect(firstBlock.component).toBe("MetricCard");
  });

  it("throws when adapter returns invalid shape", async () => {
    const adapter: SCUIAdapter = {
      async generate<T = unknown>(): Promise<SCUIModelResponse<T>> {
        return { data: {} as T };
      },
    };

    await expect(
      executeSCUIRequest(
        {
          prompt: "Show metrics",
          catalog: [],
        },
        { adapter },
      ),
    ).rejects.toThrowError();
  });
});

