import React from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const AuthInput = ({
    label,
    icon,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    showPasswordToggle,
    onToggleShowPassword,
    rightButton, // { text, onPress, disabled, checked }
    error,
    success,
    helperText, // 추가: 하단 안내 메시지
    keyboardType = 'default',
    autoCapitalize = 'none'
}) => {
    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.row}>
                <View style={[
                    styles.inputContainer,
                    success ? styles.inputSuccess : (error ? styles.inputError : null)
                ]}>
                    <Ionicons name={icon} size={20} color="#999" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder={placeholder}
                        value={value}
                        onChangeText={onChangeText}
                        secureTextEntry={secureTextEntry}
                        keyboardType={keyboardType}
                        autoCapitalize={autoCapitalize}
                        placeholderTextColor="#999"
                    />
                    {onToggleShowPassword && (
                        <TouchableOpacity onPress={onToggleShowPassword}>
                            <Ionicons name={secureTextEntry ? "eye-off-outline" : "eye-outline"} size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                {rightButton && (
                    <TouchableOpacity
                        style={[styles.rightButton, rightButton.checked && styles.checkedButton]}
                        onPress={rightButton.onPress}
                        disabled={rightButton.disabled}
                    >
                        <Text style={styles.rightButtonText}>{rightButton.text}</Text>
                    </TouchableOpacity>
                )}
            </View>
            {helperText && (
                <Text style={[
                    styles.helperText,
                    success ? styles.successText : (error ? styles.errorText : null)
                ]}>
                    {helperText}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 8 },
    row: { flexDirection: 'row', alignItems: 'center' },
    inputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 52,
        borderWidth: 1,
        borderColor: '#eee',
    },
    icon: { marginRight: 10 },
    input: { flex: 1, color: '#333', fontSize: 15 },
    rightButton: {
        backgroundColor: '#333',
        height: 52,
        borderRadius: 10,
        paddingHorizontal: 15,
        justifyContent: 'center',
        marginLeft: 10,
    },
    checkedButton: { backgroundColor: '#2e7d32' },
    rightButtonText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
    inputSuccess: { borderColor: '#2e7d32', backgroundColor: '#f0f9f0' },
    inputError: { borderColor: '#d32f2f', backgroundColor: '#fff8f8' },
    helperText: { fontSize: 11, marginTop: 4, marginLeft: 2, color: '#999' },
    successText: { color: '#2e7d32' },
    errorText: { color: '#d32f2f' },
});

export default AuthInput;
