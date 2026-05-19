import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

export interface CategoryProduct {
  id: string;
  nome: string;
  preco: string;
  image: any;
}

interface CategoryScreenProps {
  title: string;
  description: string;
  products: CategoryProduct[];
  iconName: keyof typeof Ionicons.glyphMap;
}

export function CategoryScreen({
  title,
  description,
  products,
  iconName,
}: CategoryScreenProps) {
  const { theme, colorScheme } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={22} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Ionicons name={iconName} size={24} color={theme.primary} />
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {description}
        </Text>
        {products.map((product) => (
          <View
            key={product.id}
            style={[
              styles.productCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Image
              source={product.image}
              style={styles.productImage}
              resizeMode="contain"
            />
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: theme.text }]}>
                {product.nome}
              </Text>
              <Text style={[styles.productPrice, { color: theme.primary }]}>
                {product.preco}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  productImage: {
    width: 74,
    height: 74,
    marginRight: 14,
    borderRadius: 12,
  },
  productInfo: { flex: 1 },
  productName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: "700",
  },
});
