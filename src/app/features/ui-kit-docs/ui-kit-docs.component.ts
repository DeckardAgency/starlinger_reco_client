import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

// Import all UI Kit components
import {
  // Atoms
  ButtonComponent,
  IconComponent,
  InputComponent,
  TextareaComponent,
  BadgeComponent,
  ShimmerComponent,
  SpinnerComponent,
  AvatarComponent,
  CheckboxComponent,
  SelectComponent,
  DividerComponent,
  LinkComponent,
  ToggleComponent,
  // Molecules
  FormFieldComponent,
  CardComponent,
  ToastComponent,
  TabsComponent,
  DropdownComponent,
  FileUploadComponent,
  BreadcrumbsComponent,
  EmptyStateComponent,
  PaginationComponent,
  SearchComponent,
  CalendarComponent,
  CarouselComponent,
  QuantitySelectorComponent,
  PriceDisplayComponent,
  AccordionComponent,
  AccordionItemComponent,
  // Organisms
  ModalComponent,
  DataTableComponent,
  CardGridComponent,
  DrawerComponent,
  // Types
  type SearchSuggestion,
  type CarouselSlide,
  type DropdownItem,
  type BreadcrumbItem,
  type TabItem,
  type SelectOption,
  type TableColumn
} from '@app/ui-kit';

interface ComponentSection {
  id: string;
  title: string;
  type: 'atoms' | 'molecules' | 'organisms';
}

@Component({
  selector: 'app-ui-kit-docs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    // Atoms
    ButtonComponent,
    IconComponent,
    InputComponent,
    TextareaComponent,
    BadgeComponent,
    ShimmerComponent,
    SpinnerComponent,
    AvatarComponent,
    CheckboxComponent,
    SelectComponent,
    DividerComponent,
    LinkComponent,
    ToggleComponent,
    // Molecules
    FormFieldComponent,
    CardComponent,
    ToastComponent,
    TabsComponent,
    DropdownComponent,
    FileUploadComponent,
    BreadcrumbsComponent,
    EmptyStateComponent,
    PaginationComponent,
    SearchComponent,
    CalendarComponent,
    CarouselComponent,
    QuantitySelectorComponent,
    PriceDisplayComponent,
    AccordionComponent,
    AccordionItemComponent,
    // Organisms
    ModalComponent,
    DataTableComponent,
    CardGridComponent,
    DrawerComponent
  ],
  templateUrl: './ui-kit-docs.component.html',
  styleUrls: ['./ui-kit-docs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiKitDocsComponent {
  // Navigation
  activeSection = 'button';
  sections: ComponentSection[] = [
    // Atoms
    { id: 'button', title: 'Button', type: 'atoms' },
    { id: 'icon', title: 'Icon', type: 'atoms' },
    { id: 'input', title: 'Input', type: 'atoms' },
    { id: 'textarea', title: 'Textarea', type: 'atoms' },
    { id: 'badge', title: 'Badge', type: 'atoms' },
    { id: 'shimmer', title: 'Shimmer', type: 'atoms' },
    { id: 'spinner', title: 'Spinner', type: 'atoms' },
    { id: 'avatar', title: 'Avatar', type: 'atoms' },
    { id: 'checkbox', title: 'Checkbox', type: 'atoms' },
    { id: 'select', title: 'Select', type: 'atoms' },
    { id: 'divider', title: 'Divider', type: 'atoms' },
    { id: 'link', title: 'Link', type: 'atoms' },
    { id: 'toggle', title: 'Toggle', type: 'atoms' },
    // Molecules
    { id: 'form-field', title: 'Form Field', type: 'molecules' },
    { id: 'card', title: 'Card', type: 'molecules' },
    { id: 'toast', title: 'Toast', type: 'molecules' },
    { id: 'tabs', title: 'Tabs', type: 'molecules' },
    { id: 'dropdown', title: 'Dropdown', type: 'molecules' },
    { id: 'file-upload', title: 'File Upload', type: 'molecules' },
    { id: 'breadcrumbs', title: 'Breadcrumbs', type: 'molecules' },
    { id: 'empty-state', title: 'Empty State', type: 'molecules' },
    { id: 'pagination', title: 'Pagination', type: 'molecules' },
    { id: 'search', title: 'Search', type: 'molecules' },
    { id: 'calendar', title: 'Calendar', type: 'molecules' },
    { id: 'carousel', title: 'Carousel', type: 'molecules' },
    { id: 'quantity-selector', title: 'Quantity Selector', type: 'molecules' },
    { id: 'price-display', title: 'Price Display', type: 'molecules' },
    { id: 'accordion', title: 'Accordion', type: 'molecules' },
    // Organisms
    { id: 'modal', title: 'Modal', type: 'organisms' },
    { id: 'data-table', title: 'Data Table', type: 'organisms' },
    { id: 'card-grid', title: 'Card Grid', type: 'organisms' },
    { id: 'drawer', title: 'Drawer', type: 'organisms' }
  ];

  // Demo states
  inputValue = '';
  textareaValue = '';
  checkboxChecked = false;
  selectedOption = '';
  selectedDate: Date | null = null;
  isModalOpen = false;
  isDrawerOpen = false;
  currentPage = 1;
  toggleChecked = false;
  quantity = 1;

  // Demo data
  selectOptions: SelectOption[] = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4', disabled: true }
  ];

  dropdownItems: DropdownItem[] = [
    { id: '1', label: 'Edit', icon: 'edit' },
    { id: '2', label: 'Duplicate', icon: 'copy' },
    { id: '3', label: 'Archive', icon: 'archive' },
    { id: 'divider', label: '', divider: true },
    { id: '4', label: 'Delete', icon: 'trash', danger: true }
  ];

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', route: '/' },
    { label: 'Products', route: '/products' },
    { label: 'Category', route: '/products/category' },
    { label: 'Current Item' }
  ];

  tabItems: TabItem[] = [
    { id: 'tab1', label: 'Overview', icon: 'home' },
    { id: 'tab2', label: 'Details', icon: 'file' },
    { id: 'tab3', label: 'Settings', icon: 'settings' },
    { id: 'tab4', label: 'Disabled', disabled: true }
  ];

  searchSuggestions: SearchSuggestion[] = [
    { id: '1', label: 'Product XYZ-100', description: 'Part number: 12345', icon: 'package', type: 'product' },
    { id: '2', label: 'Spare Part ABC', description: 'Part number: ABC-001', icon: 'package', type: 'product' },
    { id: '3', label: 'Component #5678', description: 'Available', icon: 'box', type: 'product' }
  ];

  carouselSlides: CarouselSlide[] = [
    { id: 1, imageUrl: 'https://picsum.photos/800/400?random=1', title: 'Slide 1', description: 'First slide description' },
    { id: 2, imageUrl: 'https://picsum.photos/800/400?random=2', title: 'Slide 2', description: 'Second slide description' },
    { id: 3, imageUrl: 'https://picsum.photos/800/400?random=3', title: 'Slide 3', description: 'Third slide description' }
  ];

  tableColumns: TableColumn<Record<string, unknown>>[] = [
    { key: 'id', label: 'ID', sortable: true, width: '80px' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'date', label: 'Date', sortable: true }
  ];

  tableData = [
    { id: 1, name: 'Item One', status: 'Active', date: '2024-01-15' },
    { id: 2, name: 'Item Two', status: 'Pending', date: '2024-01-16' },
    { id: 3, name: 'Item Three', status: 'Completed', date: '2024-01-17' },
    { id: 4, name: 'Item Four', status: 'Active', date: '2024-01-18' },
    { id: 5, name: 'Item Five', status: 'Inactive', date: '2024-01-19' }
  ];

  cardGridItems = [
    { id: 1, title: 'Card 1', description: 'Description for card 1' },
    { id: 2, title: 'Card 2', description: 'Description for card 2' },
    { id: 3, title: 'Card 3', description: 'Description for card 3' },
    { id: 4, title: 'Card 4', description: 'Description for card 4' },
    { id: 5, title: 'Card 5', description: 'Description for card 5' },
    { id: 6, title: 'Card 6', description: 'Description for card 6' }
  ];

  iconList = [
    'home', 'search', 'settings', 'user', 'users', 'mail', 'phone', 'calendar',
    'clock', 'check', 'close', 'plus', 'minus', 'edit', 'trash', 'copy',
    'download', 'upload', 'file', 'folder', 'image', 'link', 'eye', 'eye-off',
    'lock', 'unlock', 'star', 'heart', 'bell', 'filter', 'sort', 'refresh',
    'chevron-left', 'chevron-right', 'chevron-up', 'chevron-down', 'arrow-left',
    'arrow-right', 'arrow-up', 'arrow-down', 'external-link', 'menu', 'more-vertical',
    'info', 'warning', 'error', 'success', 'help', 'logout', 'login'
  ];

  get atomSections(): ComponentSection[] {
    return this.sections.filter(s => s.type === 'atoms');
  }

  get moleculeSections(): ComponentSection[] {
    return this.sections.filter(s => s.type === 'molecules');
  }

  get organismSections(): ComponentSection[] {
    return this.sections.filter(s => s.type === 'organisms');
  }

  scrollTo(sectionId: string): void {
    this.activeSection = sectionId;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onButtonClick(): void {
    console.log('Button clicked!');
  }

  onSearch(query: string): void {
    console.log('Search:', query);
  }

  onDateSelect(date: Date): void {
    this.selectedDate = date;
    console.log('Date selected:', date);
  }

  onFileSelect(files: File[]): void {
    console.log('Files selected:', files);
  }

  onTabChange(tabId: string): void {
    console.log('Tab changed:', tabId);
  }

  onDropdownSelect(item: DropdownItem): void {
    console.log('Dropdown item selected:', item);
  }

  openModal(): void {
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  openDrawer(): void {
    this.isDrawerOpen = true;
  }

  closeDrawer(): void {
    this.isDrawerOpen = false;
  }

  trackBySection(index: number, section: ComponentSection): string {
    return section.id;
  }

  trackByIndex(index: number): number {
    return index;
  }
}
