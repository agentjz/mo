import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type {
  EditorCharacterImages as CharacterImages,
  EditorImage as NodeImage,
  EditorStoryMeta as StoryMeta,
  StoryFlowNode as StoryNode,
} from '../ui/editor/flowTypes.ts';
import { processImageFile, validateImageFile } from '../utils/imageProcessor.ts';
import { useTheme } from '../contexts/ThemeContext.tsx';
import type { Hotspot } from './HotspotEditor.tsx';
import { dataUrlToBlob } from '../platform/export/binary.ts';
import { workspaceService } from '../application/workspace/WorkspaceService.ts';
import { useAssetUrl } from '../hooks/useAssetUrl.ts';
import BackgroundImageSection from './BackgroundImageSection.tsx';
import CharacterImageSection, { type CharacterPosition } from './CharacterImageSection.tsx';
import DialogBoxSettings from './DialogBoxSettings.tsx';
import HotspotManager from './HotspotManager.tsx';

interface NodeVisualPanelProps {
  node: StoryNode;
  allNodes: StoryNode[];
  onUpdate: (nodeId: string, data: Partial<StoryNode['data']>) => void;
  storyMeta: StoryMeta;
  onDraftChange?: () => void;
}

export interface NodeVisualPanelRef {
  applyChanges: () => Partial<StoryNode['data']>;
}

const NodeVisualPanel = forwardRef<NodeVisualPanelRef, NodeVisualPanelProps>(
  ({ node, allNodes, onUpdate, storyMeta, onDraftChange }, ref) => {
    const { currentTheme } = useTheme();
    const isDark = currentTheme === 'theme.dark';
    const [nodeImage, setNodeImage] = useState<NodeImage>();
    const [characterImages, setCharacterImages] = useState<CharacterImages>({});
    const [uploading, setUploading] = useState(false);
    const [uploadingCharacter, setUploadingCharacter] = useState<string | null>(null);
    const [editingHotspots, setEditingHotspots] = useState(false);
    const [hotspots, setHotspots] = useState<Hotspot[]>([]);
    const [dialogBoxPosition, setDialogBoxPosition] = useState<'top' | 'center' | 'bottom'>('bottom');
    const [dialogBoxHeight, setDialogBoxHeight] = useState(200);
    const [dialogBoxWidth, setDialogBoxWidth] = useState(90);
    const [dialogBoxOpacity, setDialogBoxOpacity] = useState(0.8);
    const [dialogBoxPadding, setDialogBoxPadding] = useState(24);
    const [dialogBoxRadius, setDialogBoxRadius] = useState(12);
    const [dialogBoxBlur, setDialogBoxBlur] = useState(15);
    const [dialogBoxFontSize, setDialogBoxFontSize] = useState(18);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const characterFileInputRefs = {
      left: useRef<HTMLInputElement>(null),
      center: useRef<HTMLInputElement>(null),
      right: useRef<HTMLInputElement>(null),
    };
    const draftFingerprintRef = useRef('');
    const nodeImageUrl = useAssetUrl(nodeImage?.imagePath);
    const characterImageUrls = {
      left: useAssetUrl(characterImages.left?.imagePath),
      center: useAssetUrl(characterImages.center?.imagePath),
      right: useAssetUrl(characterImages.right?.imagePath),
    };

    useEffect(() => {
      setNodeImage(node.data.image);
      setCharacterImages(node.data.characterImages || {});
      const data = node.data as any;
      setHotspots(data.pluginData?.['image-hotspots'] || []);
      const config = data.pluginData?.['ui-config'] || {};
      setDialogBoxPosition(config.dialogBoxPosition || 'bottom');
      setDialogBoxHeight(config.dialogBoxHeight || 200);
      setDialogBoxWidth(config.dialogBoxWidth || 90);
      setDialogBoxOpacity(config.dialogBoxOpacity ?? 0.8);
      setDialogBoxPadding(config.dialogBoxPadding || 24);
      setDialogBoxRadius(config.dialogBoxRadius || 12);
      setDialogBoxBlur(config.dialogBoxBlur ?? 15);
      setDialogBoxFontSize(config.dialogBoxFontSize || 18);
      setEditingHotspots(false);
    }, [node]);

    const buildData = (): Partial<StoryNode['data']> => ({
      image: nodeImage,
      characterImages,
      pluginData: {
        'image-hotspots': hotspots.length > 0 ? hotspots : undefined,
        'ui-config': {
          dialogBoxPosition,
          dialogBoxHeight,
          dialogBoxWidth,
          dialogBoxOpacity,
          dialogBoxPadding,
          dialogBoxRadius,
          dialogBoxBlur,
          dialogBoxFontSize,
        },
      },
    } as any);

    useImperativeHandle(ref, () => ({ applyChanges: buildData }), [
      node.id, onUpdate, nodeImage, characterImages, hotspots,
      dialogBoxPosition, dialogBoxHeight, dialogBoxWidth, dialogBoxOpacity,
      dialogBoxPadding, dialogBoxRadius, dialogBoxBlur, dialogBoxFontSize,
    ]);

    useEffect(() => {
      const fingerprint = JSON.stringify(buildData());
      if (draftFingerprintRef.current && draftFingerprintRef.current !== fingerprint) onDraftChange?.();
      draftFingerprintRef.current = fingerprint;
    }, [
      nodeImage, characterImages, hotspots, dialogBoxPosition, dialogBoxHeight,
      dialogBoxWidth, dialogBoxOpacity, dialogBoxPadding, dialogBoxRadius,
      dialogBoxBlur, dialogBoxFontSize, onDraftChange,
    ]);

    const uploadImage = async (file: File): Promise<NodeImage> => {
      const processed = await processImageFile(file);
      const blob = await dataUrlToBlob(processed.imageData);
      const uploaded = await workspaceService.putAsset({
        blob,
        mimeType: blob.type,
        fileName: processed.fileName,
        width: processed.width,
        height: processed.height,
      });
      return {
        imagePath: uploaded.id,
        fileName: uploaded.fileName,
        fileSize: uploaded.size,
        originalFormat: processed.originalFormat,
        hash: uploaded.hash,
        width: uploaded.width,
        height: uploaded.height,
      };
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const file = event.target.files?.[0];
      if (!file) return;
      const validation = validateImageFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      setUploading(true);
      try {
        setNodeImage(await uploadImage(file));
      } catch (error) {
        alert('图片上传失败: ' + (error as Error).message);
      } finally {
        setUploading(false);
        event.target.value = '';
      }
    };

    const handleCharacterImageUpload = async (
      event: React.ChangeEvent<HTMLInputElement>,
      position: CharacterPosition,
    ): Promise<void> => {
      const file = event.target.files?.[0];
      if (!file) return;
      const validation = validateImageFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      setUploadingCharacter(position);
      try {
        const image = await uploadImage(file);
        setCharacterImages(current => ({ ...current, [position]: image }));
      } catch (error) {
        alert('图片上传失败: ' + (error as Error).message);
      } finally {
        setUploadingCharacter(null);
        event.target.value = '';
      }
    };

    if (storyMeta.displayMode !== 'visual-novel') {
      return (
        <div style={{
          padding: '16px', textAlign: 'center', color: isDark ? '#9ca3af' : '#6b7280', fontSize: '0.875rem',
        }}>
          <div style={{ marginBottom: '8px' }}>当前故事为终端模式</div>
          <div>切换到视觉小说模式以使用此功能</div>
        </div>
      );
    }

    return (
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          fontSize: '0.95rem', fontWeight: '600', color: isDark ? '#e2e8f0' : '#1f2937',
          borderBottom: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, paddingBottom: '8px',
        }}>
          视觉配置
        </div>
        <DialogBoxSettings
          isDark={isDark}
          position={dialogBoxPosition}
          height={dialogBoxHeight}
          width={dialogBoxWidth}
          opacity={dialogBoxOpacity}
          padding={dialogBoxPadding}
          radius={dialogBoxRadius}
          blur={dialogBoxBlur}
          fontSize={dialogBoxFontSize}
          onPositionChange={setDialogBoxPosition}
          onHeightChange={setDialogBoxHeight}
          onWidthChange={setDialogBoxWidth}
          onOpacityChange={setDialogBoxOpacity}
          onPaddingChange={setDialogBoxPadding}
          onRadiusChange={setDialogBoxRadius}
          onBlurChange={setDialogBoxBlur}
          onFontSizeChange={setDialogBoxFontSize}
        />
        <BackgroundImageSection
          image={nodeImage}
          imageUrl={nodeImageUrl}
          uploading={uploading}
          editingHotspots={editingHotspots}
          hotspotCount={hotspots.length}
          isDark={isDark}
          fileInputRef={fileInputRef}
          onImageChange={setNodeImage}
          onUpload={event => void handleImageUpload(event)}
          onDelete={() => setNodeImage(undefined)}
          onToggleHotspots={() => setEditingHotspots(current => !current)}
        />
        {editingHotspots && nodeImage && (
          <HotspotManager
            nodeId={node.id}
            imageUrl={nodeImageUrl}
            allNodes={allNodes}
            hotspots={hotspots}
            isDark={isDark}
            onChange={setHotspots}
          />
        )}
        <CharacterImageSection
          images={characterImages}
          imageUrls={characterImageUrls}
          uploadingPosition={uploadingCharacter}
          fileInputRefs={characterFileInputRefs}
          isDark={isDark}
          onImagesChange={setCharacterImages}
          onUpload={(event, position) => void handleCharacterImageUpload(event, position)}
          onDelete={position => setCharacterImages(current => {
            const next = { ...current };
            delete next[position];
            return next;
          })}
        />
      </div>
    );
  },
);

export default NodeVisualPanel;
