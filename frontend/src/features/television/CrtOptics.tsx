import { CrtTexture } from "./CrtTexture";
import { CrtRenderer } from './CrtRenderer';
/** The optical layer stays separate from the interactive picture. */
export function CrtOptics() {
  return (
    <>
      <CrtRenderer/>
      <CrtTexture />
      <div className="crt-lens" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="crt-glass" aria-hidden="true" />
      <div className="crt-scanlines" aria-hidden="true" />
    </>
  );
}
