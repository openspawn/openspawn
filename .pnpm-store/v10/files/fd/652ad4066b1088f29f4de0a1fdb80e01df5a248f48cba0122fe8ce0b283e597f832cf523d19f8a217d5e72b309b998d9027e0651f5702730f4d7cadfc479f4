import * as React from 'react';
import { BaseUIComponentProps } from "../../utils/types.js";
import type { AvatarRoot } from "../root/AvatarRoot.js";
import { ImageLoadingStatus } from "./useImageLoadingStatus.js";
/**
 * The image to be displayed in the avatar.
 * Renders an `<img>` element.
 *
 * Documentation: [Base UI Avatar](https://base-ui.com/react/components/avatar)
 */
export declare const AvatarImage: React.ForwardRefExoticComponent<Omit<AvatarImageProps, "ref"> & React.RefAttributes<HTMLImageElement>>;
export interface AvatarImageProps extends BaseUIComponentProps<'img', AvatarRoot.State> {
  /**
   * Callback fired when the loading status changes.
   */
  onLoadingStatusChange?: (status: ImageLoadingStatus) => void;
}
export declare namespace AvatarImage {
  type Props = AvatarImageProps;
}