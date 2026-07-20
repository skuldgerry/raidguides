import { docs } from 'fumadocs-mdx:collections/server';
import { loader } from 'fumadocs-core/source';
import { BookOpen } from 'lucide-react';
import { createElement, type ComponentType, type SVGProps } from 'react';
import {
  RaidWing1Icon,
  RaidWing2Icon,
  RaidWing3Icon,
  RaidWing4Icon,
} from '@/components/raid-wing-icon';
import { Division2Icon, GuildWars2Icon } from '@/components/game-icon';

const navigationIcons: Record<
  string,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  BookOpen,
  GuildWars2: GuildWars2Icon,
  Division2: Division2Icon,
  RaidWing1: RaidWing1Icon,
  RaidWing2: RaidWing2Icon,
  RaidWing3: RaidWing3Icon,
  RaidWing4: RaidWing4Icon,
};

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  // Resolve the small, intentional icon set used by our meta.json files.
  // Game and wing badges are custom monochrome SVGs; introduction uses Lucide.
  icon(name) {
    const Icon = name ? navigationIcons[name] : undefined;
    return Icon ? createElement(Icon) : undefined;
  },
});
